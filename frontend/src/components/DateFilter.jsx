export default function DateFilter({ start, end, onStart, onEnd, onSearch, onReset, children }) {
  return (
    <div className="card mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Boshlanish</label>
          <input type="date" className="input-field w-44" value={start} onChange={e=>onStart(e.target.value)}/>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Oxiri</label>
          <input type="date" className="input-field w-44" value={end} onChange={e=>onEnd(e.target.value)}/>
        </div>
        <button onClick={onSearch} className="btn-primary">🔍 Izlash</button>
        <button onClick={onReset}  className="btn-secondary">✕ Tozalash</button>
        {children}
      </div>
    </div>
  )
}
