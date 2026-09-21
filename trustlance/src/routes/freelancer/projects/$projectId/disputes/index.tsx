import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'
import { useProjectEscrow } from '../../../../../hooks/project.hooks'
import { useMilestones } from '../../../../../hooks/milestone.hooks'

export const Route = createFileRoute('/freelancer/projects/$projectId/disputes/')({
  component: FreelancerDisputesList,
})

function FreelancerDisputesList() {
  const { projectId } = Route.useParams()
  const { data: projectAddress, isLoading: addressLoading } = useProjectEscrow(projectId)
  const { data: milestones, isLoading: listLoading } = useMilestones(projectAddress)

  if (addressLoading || listLoading) {
    return <div className="p-4">Loading disputes...</div>
  }

  if (!milestones) {
    return <div className="p-4">No milestones found.</div>
  }

  const disputedMilestones = milestones?.filter(m => m[2] === 0)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Project Disputes</h1>
      
      {disputedMilestones && disputedMilestones.length > 0 ? (
        <div className="grid gap-4">
          {disputedMilestones.map((milestone) => {
            const index = milestones.findIndex((item) => item === milestone)
            return (
            <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-red-800">Milestone #{index} Disputed</h3>
                <p className="text-sm text-red-600">A dispute has been raised for this deliverable.</p>
              </div>
              <Link 
                to="/freelancer/projects/$projectId/disputes/$disputeId" 
                params={{ projectId, disputeId: index.toString() }}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
              >
                Resolve
              </Link>
            </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-500">
          No active disputes for this project.
        </div>
      )}
    </div>
  )
}
