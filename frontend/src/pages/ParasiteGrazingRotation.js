import React, { useEffect, useState } from 'react';
export default function ParasiteGrazingRotation() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/parasite-grazing-rotation').then(r => r.json()).then(setData).catch(() => {}); }, []);
  return <div><h1>Parasite Grazing Rotation</h1><p>Plans paddock rotation from fecal egg count, grazing duration, and rest period.</p>{data?.paddocks?.map(p => <section className="card" key={p.paddock}><h2>{p.paddock}</h2><p>{p.action} - pressure {p.parasite_pressure}</p></section>)}</div>;
}
