import { createFileRoute } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'
import { useProjectEscrow } from '../../../../../hooks/project.hooks'
import { useMilestoneCount, useMilestones } from '../../../../../hooks/milestone.hooks'
import { Shell } from '../../../../-components'

export const Route = createFileRoute('/company/projects/$projectId/milestones/')({
  component: CompanyMilestonesList,
})

function CompanyMilestonesList() {
  const { projectId } = Route.useParams()
  const { data: projectAddress, isLoading: addressLoading } = useProjectEscrow(projectId)
  const { data: count, isLoading: countLoading } = useMilestoneCount(projectAddress)
  const { data: milestones, isLoading: listLoading } = useMilestones(projectAddress)

  if (addressLoading || countLoading || listLoading) {
    return <Shell title="Project milestones" role="company"><p>Loading milestones...</p></Shell>
  }

  return (
    <Shell title="Project milestones" role="company">
      <div className="flex justify-between items-center mb-6">
        <Link to="/company/projects/$projectId/milestones/new" params={{ projectId }} className="rounded bg-zinc-950 px-3 py-2 text-sm text-white">Add milestones</Link>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
          Total: {count?.toString() || '0'}
        </span>
      </div>

      <div className="grid gap-4">
        {milestones && milestones.length > 0 ? (
          milestones.map((_m, index) => (
            <div key={index} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
              <div>
                <h3 className="font-semibold">Milestone #{index}</h3>
                <div className="flex gap-2 mt-1">
                  {/* <span className={`text-xs px-2 py-0.5 rounded ${
                    m.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                    m.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 
                    m.status === 'DISPUTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {m.status}
                  </span> */}
                  {/* <span className="text-xs text-gray-500 font-mono">{m.amount?.toString()} ETH</span> */}
                </div>
              </div>
              <Link
                to="/company/projects/$projectId/milestones/$milestoneId"
                params={{ projectId, milestoneId: index.toString() }}
                className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                Manage
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-500">
            No milestones defined for this project.
          </div>
        )}
      </div>
    </Shell>
  )
}
