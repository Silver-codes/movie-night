import { HealthStatus } from './components/HealthStatus'

function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <h1 className="text-4xl font-bold">Movie Night</h1>
      <HealthStatus />
    </main>
  )
}

export default App
