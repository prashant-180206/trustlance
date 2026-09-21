import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'
import { useProjectEscrow } from '../../../../../hooks/project.hooks'
import { useMilestoneCount, useMilestones } from '../../../../../hooks/milestone.hooks'

export const Route = createFileRoute('/freelancer/projects/$projectId/milestones/')({
  component: MilestonesList,
})

function MilestonesList() {
  const { projectId } = Route.useParams()
  const { data: projectAddress, isLoading: addressLoading } = useProjectEscrow(projectId)
  const { data: count, isLoading: countLoading } = useMilestoneCount(projectAddress)
  const { data: milestones, isLoading: listLoading } = useMilestones(projectAddress)

  if (addressLoading || countLoading || listLoading) {
    return <div className="p-4">Loading milestones...</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Project Milestones</h1>
      <p className="mb-4">Total Milestones: {count?.toString() || '0'}</p>
      
      <div className="grid gap-4">
        {milestones && milestones.length > 0 ? (
          milestones.map((_m, index) => (
            <div key={index} className="p-4 border rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Milestone #{index}</h3>
                <p className="text-sm text-gray-600">Status: {milestones![index][2]}</p>
              </div>
              <Link 
                to="/freelancer/projects/$projectId/milestones/$milestoneId" 
                params={{ projectId, milestoneId: index.toString() }}
                className="text-blue-600 hover:underline"
              >
                View Details
              </Link>
            </div>
          ))
        ) : (
          <p>No milestones found for this project.</p>
        )}
      </div>
    </div>
  )
}
