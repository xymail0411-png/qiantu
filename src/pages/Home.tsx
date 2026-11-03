import GoalBar from '../components/GoalBar'
import Timeline from '../components/Timeline'

export default function HomePage({ isDataDropdownOpen }: { isDataDropdownOpen: boolean }) {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4">
        <GoalBar />
      </div>
      <Timeline collapsedByParent={isDataDropdownOpen} />
    </div>
  )
}
