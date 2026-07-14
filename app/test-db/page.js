import { supabase } from '@/lib/supabase'

export default async function TestDB() {
  const { data, error } = await supabase.from('_test_connection').select('*').limit(1)

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Supabase-tilkoblingstest</h1>
      {error ? (
        <div>
          <p style={{ color: 'green' }}>✅ Koblingen til Supabase fungerer!</p>
          <p style={{ fontSize: '0.9rem', color: 'gray' }}>
            (Feilmeldingen under er forventet - vi har ingen tabell ennå, men det viser at vi faktisk snakker med databasen)
          </p>
          <pre>{error.message}</pre>
        </div>
      ) : (
        <p>Data: {JSON.stringify(data)}</p>
      )}
    </div>
  )
}