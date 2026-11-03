import { useState } from 'react'
import GoalBar from '../components/GoalBar'
import Timeline from '../components/Timeline'
import DataDropdown from '../components/DataDropdown'

export default function HomePage() {
  const [isDataDropdownOpen, setIsDataDropdownOpen] = useState(false)

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4">
        <GoalBar />
      </div>
      <DataDropdown onOpenChange={setIsDataDropdownOpen} />
      <Timeline collapsedByParent={isDataDropdownOpen} />
    </div>
  )
}
