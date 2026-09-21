import { createFileRoute } from '@tanstack/react-router'
// import { useProjectEscrow } from '../../../hooks/project.hooks'
// import { useMilestone, useApproveMilestone, useRejectMilestone, useAutoApproveMilestone } from '../../../hooks/milestone.hooks'
import { useProjectEscrow } from '../../../../../hooks/project.hooks'
import { useAcceptRejection, useApproveMilestone, useAutoApproveMilestone, useMilestone, useRaiseDispute, useRejectMilestone, useWithdrawRejection } from '../../../../../hooks/milestone.hooks'
import { Button, Shell } from '../../../../-components'

export const Route = createFileRoute('/company/projects/$projectId/milestones/$milestoneId')({
  component: CompanyMilestoneDetail,
})

function CompanyMilestoneDetail() {
  const { projectId, milestoneId } = Route.useParams()
  const { data: projectAddress, isLoading: addressLoading } = useProjectEscrow(projectId)
  const index = BigInt(milestoneId)
  const { data: milestone, isLoading: milestoneLoading } = useMilestone(projectAddress, index)
  const approve = useApproveMilestone()
  const reject = useRejectMilestone()
  const autoApprove = useAutoApproveMilestone()
  const raiseDispute = useRaiseDispute()
  const withdrawRejection = useWithdrawRejection()
  const acceptRejection = useAcceptRejection()

  if (addressLoading || milestoneLoading) {
    return <Shell title={`Milestone #${milestoneId}`} role="company"><p>Loading milestone...</p></Shell>
  }

  return (
    <Shell title={`Manage milestone #${milestoneId}`} role="company">

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500 text-sm block">Status</span>
            <span className="font-bold">{milestone?.[2] || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm block">Payment Amount</span>
            <span className="font-bold">{milestone?.[1]?.toString() || '0'} ETH</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm block">Deliverable CID</span>
            <span className="font-mono text-xs break-all block bg-white p-1 border rounded">
              {milestone?.[5] || 'Not submitted'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-wrap gap-2">
          <Button disabled={!projectAddress || approve.isPending} onClick={() => projectAddress && approve.mutate({ projectAddress, index })}>Approve</Button>
          <Button disabled={!projectAddress || reject.isPending} onClick={() => projectAddress && reject.mutate({ projectAddress, index })}>Reject</Button>
          <Button disabled={!projectAddress || autoApprove.isPending} onClick={() => projectAddress && autoApprove.mutate({ projectAddress, index })}>Auto approve</Button>
          <Button disabled={!projectAddress || raiseDispute.isPending} onClick={() => projectAddress && raiseDispute.mutate({ projectAddress, index })}>Raise dispute</Button>
          <Button disabled={!projectAddress || withdrawRejection.isPending} onClick={() => projectAddress && withdrawRejection.mutate({ projectAddress, index })}>Withdraw rejection</Button>
          <Button disabled={!projectAddress || acceptRejection.isPending} onClick={() => projectAddress && acceptRejection.mutate({ projectAddress, index })}>Accept rejection</Button>
        </div>

        {milestone?.[2] === 2 && (
          <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200 text-center font-medium">
            Payment has been released for this milestone.
          </div>
        )}
      </div>
    </Shell>
  )
}
