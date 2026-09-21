import { createFileRoute, Link } from '@tanstack/react-router'
import { useProjectEscrow } from '../../../../../hooks/project.hooks'
import { useMilestone, useAutoResolveDispute } from '../../../../../hooks/milestone.hooks'
import { Button, ErrorMessage, Shell } from '../../../../-components'

export const Route = createFileRoute('/company/projects/$projectId/disputes/$disputeId')({
  component: CompanyDisputeDetail,
})

function CompanyDisputeDetail() {
  const { projectId, disputeId } = Route.useParams()
  const { data: projectAddress, isLoading: addressLoading } = useProjectEscrow(projectId)
  const { data: milestone, isLoading: milestoneLoading } = useMilestone(projectAddress, BigInt(disputeId))
  const { mutateAsync: resolveDispute, isPending: isResolving, error: resolveDisputeError } = useAutoResolveDispute()

  if (addressLoading || milestoneLoading) {
    return <Shell title="Dispute" role="company"><p>Loading dispute details...</p></Shell>
  }

  const handleResolve = async () => {
    try {
      await resolveDispute({
        projectAddress: projectAddress!,
        index: BigInt(disputeId),
      })
      alert('Dispute resolved successfully!')
    } catch (e) {
      alert('Resolution failed: ' + (e as Error).message)
    }
  }

  return (
    <Shell title={`Resolve dispute #${disputeId}`} role="company">
      
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500 text-sm block">Milestone Index</span>
            <span className="font-bold">{disputeId}</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm block">Locked Funds</span>
            <span className="font-bold">{milestone?.[1]?.toString()} ETH</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 text-sm block">Deliverable CID</span>
            <span className="font-mono text-xs break-all block bg-white p-1 border rounded">
              {milestone?.[5] || 'No CID provided'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-gray-600 text-sm">
          Resolving the dispute typically involves utilizing the DAO or an arbitrator. 
          For this prototype, the "Auto-Resolve" function simulates a resolution decision.
        </p>
        <Button
          onClick={handleResolve}
          disabled={isResolving}
        >
          {isResolving ? 'Resolving...' : 'Execute Resolution Decision'}
        </Button>
        <ErrorMessage error={resolveDisputeError} />
        <Link to="/company/projects/$projectId/milestones/$milestoneId" params={{ projectId, milestoneId: disputeId }} className="text-sm underline">Open milestone actions</Link>
      </div>
    </Shell>
  )
}
