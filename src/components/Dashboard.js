import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const Dashboard = () => {
  const [popularityData, setPopularityData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [temporalData, setTemporalData] = useState([]);
  const [geographicalData, setGeographicalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('');

  const regions = [
    { value: '', label: 'All Regions' },
    { value: 'Worldwide', label: 'Worldwide' },
    { value: 'United States', label: 'United States' },
    { value: 'India', label: 'India' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'Japan', label: 'Japan' },
    { value: 'South Korea', label: 'South Korea' }
  ];

  const fetchData = useCallback(async () => {
    try {
      const popularityUrl = selectedRegion
        ? `http://localhost:8000/trends/popularity?region=${encodeURIComponent(selectedRegion)}`
        : 'http://localhost:8000/trends/popularity';

      const sentimentUrl = selectedRegion
        ? `http://localhost:8000/trends/sentiment?region=${encodeURIComponent(selectedRegion)}`
        : 'http://localhost:8000/trends/sentiment';

      const temporalUrl = selectedRegion
        ? `http://localhost:8000/trends/temporal?region=${encodeURIComponent(selectedRegion)}`
        : 'http://localhost:8000/trends/temporal';

      const geographicalUrl = 'http://localhost:8000/trends/geographical';

      const [popularityRes, sentimentRes, temporalRes, geographicalRes] = await Promise.all([
        axios.get(popularityUrl),
        axios.get(sentimentUrl),
        axios.get(temporalUrl),
        axios.get(geographicalUrl)
      ]);

      setPopularityData(popularityRes.data);
      setSentimentData(sentimentRes.data);
      setTemporalData(temporalRes.data);
      setGeographicalData(geographicalRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchData();
  }, [selectedRegion, fetchData]);

  if (loading) {
    return <div className="dashboard">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Social Media Trend Analysis Dashboard</h1>
        <div className="header-controls">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="region-select"
          >
            {regions.map(region => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="chart-container">
        <h2>Trend Popularity</h2>
        <Plot
          data={[
            {
              type: 'bar',
              x: popularityData.map(d => d.trend),
              y: popularityData.map(d => d.mentions),
              name: 'Mentions'
            }
          ]}
          layout={{
            title: 'Top Trending Topics',
            xaxis: { title: 'Trend' },
            yaxis: { title: 'Mentions' }
          }}
        />
      </div>

      <div className="chart-container">
        <h2>Sentiment Analysis</h2>
        <Plot
          data={[
            {
              type: 'scatter',
              mode: 'markers',
              x: sentimentData.map(d => d.trend),
              y: sentimentData.map(d => d.sentiment),
              name: 'Sentiment Score'
            }
          ]}
          layout={{
            title: 'Sentiment Distribution',
            xaxis: { title: 'Trend' },
            yaxis: { title: 'Sentiment (-1 to 1)' }
          }}
        />
      </div>

      <div className="chart-container">
        <h2>Temporal Trends</h2>
        <Plot
          data={[
            {
              type: 'line',
              x: temporalData.map(d => d.timestamp),
              y: temporalData.map(d => d.trend_count),
              name: 'Trend Count'
            }
          ]}
          layout={{
            title: 'Trends Over Time',
            xaxis: { title: 'Time' },
            yaxis: { title: 'Number of Trends' }
          }}
        />
      </div>

      <div className="chart-container">
        <h2>Geographical Sentiment Map</h2>
        <Plot
          data={[
            // Country-level choropleth
            {
              type: 'choropleth',
              locations: geographicalData.filter(d => d.type === 'country').map(d => d.country_code),
              z: geographicalData.filter(d => d.type === 'country').map(d => d.sentiment),
              text: geographicalData.filter(d => d.type === 'country').map(d => `${d.region}: ${d.sentiment} sentiment (${d.count} trends)`),
              colorscale: [
                [0, 'rgb(165,0,38)'],
                [0.25, 'rgb(215,48,39)'],
                [0.5, 'rgb(244,109,67)'],
                [0.75, 'rgb(253,174,97)'],
                [1, 'rgb(254,224,144)']
              ],
              colorbar: {
                title: 'Sentiment Score',
                titleside: 'right'
              },
              showscale: true
            },
            // City-level scatter points
            {
              type: 'scattergeo',
              mode: 'markers+text',
              lat: geographicalData.filter(d => d.type === 'city').map(d => d.lat),
              lon: geographicalData.filter(d => d.type === 'city').map(d => d.lon),
              text: geographicalData.filter(d => d.type === 'city').map(d => `${d.region}: ${d.sentiment} (${d.count} trends)`),
              marker: {
                size: geographicalData.filter(d => d.type === 'city').map(d => Math.max(d.count * 2, 8)),
                color: geographicalData.filter(d => d.type === 'city').map(d => d.sentiment),
                colorscale: [
                  [0, 'rgb(165,0,38)'],
                  [0.25, 'rgb(215,48,39)'],
                  [0.5, 'rgb(244,109,67)'],
                  [0.75, 'rgb(253,174,97)'],
                  [1, 'rgb(254,224,144)']
                ],
                showscale: false,
                opacity: 0.8
              },
              textposition: 'top center',
              textfont: {
                size: 10
              }
            }
          ]}
          layout={{
            title: 'Global Sentiment Analysis by Region',
            geo: {
              showframe: false,
              showcoastlines: true,
              projection: {
                type: 'natural earth'
              }
            },
            showlegend: false
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
