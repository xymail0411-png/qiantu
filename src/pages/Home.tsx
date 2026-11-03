import GoalBar from '../components/GoalBar'
import Timeline from '../components/Timeline'
import DataDropdown from '../components/DataDropdown'

export default function HomePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4">
        <GoalBar />
      </div>
      <DataDropdown />
      <Timeline />
    </div>
  )
}
