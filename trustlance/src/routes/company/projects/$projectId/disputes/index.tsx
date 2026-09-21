import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'
import { useProjectEscrow } from '../../../../../hooks/project.hooks'
import { useMilestones } from '../../../../../hooks/milestone.hooks'

export const Route = createFileRoute('/company/projects/$projectId/disputes/')({
  component: CompanyDisputesList,
})

function CompanyDisputesList() {
  const { projectId } = Route.useParams()
  const { data: projectAddress, isLoading: addressLoading } = useProjectEscrow(projectId)
  const { data: milestones, isLoading: listLoading } = useMilestones(projectAddress)

  if (addressLoading || listLoading) {
    return <div className="p-4">Loading disputes...</div>
  }

  const disputedMilestones = milestones?.filter(m => m[2] === 2)

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Disputes</h1>
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          {disputedMilestones?.length || 0} Active Disputes
        </span>
      </div>
      
      {disputedMilestones && disputedMilestones.length > 0 ? (
        <div className="grid gap-4">
          {disputedMilestones.map((m) => {
            const index = milestones?.findIndex((milestone) => milestone === m) ?? -1
            return (
            <div key={index} className="p-4 border border-red-200 bg-white shadow-sm rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Milestone #{index} Dispute</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Payment of <span className="font-mono font-medium">{m[1]?.toString()} ETH</span> is locked in dispute.
                </p>
              </div>
              <Link 
                to="/company/projects/$projectId/disputes/$disputeId" 
                params={{ projectId, disputeId: index.toString() }}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Review Dispute
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
