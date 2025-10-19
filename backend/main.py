from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List
import os
import json
import glob
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Trend Analysis API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class TrendData(BaseModel):
    platform: str
    trend: str
    mentions: int
    avg_volume: float
    max_volume: float

class SentimentData(BaseModel):
    platform: str
    trend: str
    sentiment: float

@app.get("/trends/popularity", response_model=List[TrendData])
async def get_popularity_trends(region: str = None):
    """Get trend popularity data, optionally filtered by region"""
    try:
       
        processed_files = glob.glob("data/processed_data_*.json")
        if not processed_files:
            return []

        latest_file = max(processed_files)
        with open(latest_file, 'r') as f:
            data = json.load(f)

        popularity_data = data.get("popularity", [])

        if region:
            # Filter data by region if specified
            popularity_data = [item for item in popularity_data if item.get('region') == region]

        return [TrendData(**item) for item in popularity_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@app.get("/trends/sentiment")
async def get_sentiment_trends(region: str = None):
    """Get sentiment analysis data, optionally filtered by region"""
    try:
        processed_files = glob.glob("data/processed_data_*.json")
        if not processed_files:
            return []

        latest_file = max(processed_files)
        with open(latest_file, 'r') as f:
            data = json.load(f)

        sentiment_data = data.get("sentiment", [])

        if region:
            # Filter data by region if specified
            sentiment_data = [item for item in sentiment_data if item.get('region') == region]

        return sentiment_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@app.get("/trends/temporal")
async def get_temporal_trends(region: str = None):
    """Get temporal trend patterns, optionally filtered by region"""
    try:
        processed_files = glob.glob("data/processed_data_*.json")
        if not processed_files:
            return []

        latest_file = max(processed_files)
        with open(latest_file, 'r') as f:
            data = json.load(f)

        temporal_data = data.get("temporal", [])

        if region:
            # Filter data by region if specified
            temporal_data = [item for item in temporal_data if item.get('region') == region]

        return temporal_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@app.get("/trends/geographical")
async def get_geographical_trends():
    """Get geographical trend data with sentiment by region"""
    try:
        processed_files = glob.glob("data/processed_data_*.json")
        if not processed_files:
            return []

        latest_file = max(processed_files)
        with open(latest_file, 'r') as f:
            data = json.load(f)

        sentiment_data = data.get("sentiment", [])

        # Aggregate sentiment by region
        region_sentiment = {}
        for item in sentiment_data:
            region = item.get('region', 'Unknown')
            sentiment = float(item.get('sentiment', 0))
            if region not in region_sentiment:
                region_sentiment[region] = {'total_sentiment': 0, 'count': 0}
            region_sentiment[region]['total_sentiment'] += sentiment
            region_sentiment[region]['count'] += 1

        # Calculate average sentiment per region and get coordinates
        geographical_data = []
        country_codes = {
            'United States': 'USA',
            'United Kingdom': 'GBR',
            'India': 'IND',
            'Canada': 'CAN',
            'Australia': 'AUS',
            'Germany': 'DEU',
            'France': 'FRA',
            'Japan': 'JPN',
            'South Korea': 'KOR',
            'Brazil': 'BRA'
        }

        # City/state coordinates for specific locations
        location_coords = {
            'New York': {'lat': 40.7128, 'lon': -74.0060},
            'Los Angeles': {'lat': 34.0522, 'lon': -118.2437},
            'Chicago': {'lat': 41.8781, 'lon': -87.6298},
            'London': {'lat': 51.5074, 'lon': -0.1278},
            'Paris': {'lat': 48.8566, 'lon': 2.3522},
            'Berlin': {'lat': 52.5200, 'lon': 13.4050},
            'Tokyo': {'lat': 35.6762, 'lon': 139.6503},
            'Sydney': {'lat': -33.8688, 'lon': 151.2093},
            'Toronto': {'lat': 43.6532, 'lon': -79.3832},
            'Mumbai': {'lat': 19.0760, 'lon': 72.8777},
            'Delhi': {'lat': 28.7041, 'lon': 77.1025},
            'Bangalore': {'lat': 12.9716, 'lon': 77.5946},
            'Seoul': {'lat': 37.5665, 'lon': 126.9780},
            'São Paulo': {'lat': -23.5505, 'lon': -46.6333},
            'Rio de Janeiro': {'lat': -22.9068, 'lon': -43.1729}
        }

        for region, values in region_sentiment.items():
            avg_sentiment = values['total_sentiment'] / values['count'] if values['count'] > 0 else 0

            # Check if it's a specific city/location or country
            if region in location_coords:
                coords = location_coords[region]
                geographical_data.append({
                    'region': region,
                    'lat': coords['lat'],
                    'lon': coords['lon'],
                    'sentiment': round(avg_sentiment, 2),
                    'count': values['count'],
                    'type': 'city'
                })
            else:
                # Country-level data
                country_code = country_codes.get(region, '')
                geographical_data.append({
                    'region': region,
                    'country_code': country_code,
                    'sentiment': round(avg_sentiment, 2),
                    'count': values['count'],
                    'type': 'country'
                })

        return geographical_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
