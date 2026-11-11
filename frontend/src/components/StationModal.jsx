import { useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { regionDefinitions, timeAgo } from '../data/mockData.js'

function StationModal({ station, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [region, setRegion] = useState('north')
  const [city, setCity] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  if (!station && !onAdd) return null

  function submit(event) {
    event.preventDefault()
    onAdd({
      name: name.trim(),
      city: city.trim(),
      region,
      lat: Number(latitude),
      lon: Number(longitude),
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header"><div><p className="eyebrow">{station ? station.id : 'NEW SENSOR'}</p><h2 id="modal-title">{station ? station.name : 'Add weather station'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
        {station ? (
          <div className="detail-grid">
            <div className="detail-item"><span>Location</span><strong><MapPin size={14} />{station.city}</strong></div>
            <div className="detail-item"><span>Region</span><strong>{regionDefinitions.find((item) => item.id === station.region)?.name}</strong></div>
            <div className="detail-item"><span>Coordinates</span><strong>{station.lat.toFixed(4)}°, {station.lon.toFixed(4)}°</strong></div>
            <div className="detail-item"><span>Connection status</span><strong className={`detail-status-${station.status}`}>{station.status[0].toUpperCase() + station.status.slice(1)}</strong></div>
            <div className="detail-item"><span>Last reading</span><strong>{timeAgo(station.minutesAgo)}</strong></div>
            <div className="detail-item"><span>Temperature</span><strong>{station.temperature.toFixed(1)} °C</strong></div>
            <div className="detail-item"><span>Humidity</span><strong>{station.humidity}%</strong></div>
            <div className="detail-item"><span>Wind speed</span><strong>{station.wind.toFixed(1)} m/s</strong></div>
            <div className="detail-item"><span>Atmospheric pressure</span><strong>{station.pressure} hPa</strong></div>
            <div className="detail-item"><span>Rainfall</span><strong>{station.rainfall.toFixed(1)} mm</strong></div>
            <div className="detail-item"><span>Stored readings</span><strong>{station.readingsStored.toLocaleString()}</strong></div>
          </div>
        ) : (
          <form className="station-form" onSubmit={submit}>
            <label>Station name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alpine Lookout" /></label>
            <label>City / location<input required value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Innsbruck, Austria" /></label>
            <div className="settings-fields coordinate-fields">
              <label>Latitude<input required type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="e.g. 47.2692" /></label>
              <label>Longitude<input required type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="e.g. 11.4041" /></label>
            </div>
            <label>Logical region<select value={region} onChange={(event) => setRegion(event.target.value)}>{regionDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <p className="form-note">The new demo station will be added to the selected logical region.</p>
            <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">Add station</button></div>
          </form>
        )}
      </section>
    </div>
  )
}

export default StationModal
