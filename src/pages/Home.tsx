import GoalBar from '../components/GoalBar'
import Timeline from '../components/Timeline'

export default function HomePage({ isDataDropdownOpen }: { isDataDropdownOpen: boolean }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      <div className="lg:w-80 xl:w-96 shrink-0">
        <GoalBar />
      </div>
      <div className="flex-1 min-w-0">
        <Timeline collapsedByParent={isDataDropdownOpen} />
      </div>
    </div>
  )
}
