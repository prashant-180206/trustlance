import { createFileRoute } from '@tanstack/react-router'
// import { useProjectEscrow } from '../../../../hooks/project.hooks'
// import { useMilestone, useSubmitMilestone } from '../../../hooks/milestone.hooks'
import { useState } from 'react'
import { useProjectEscrow } from '../../../../../hooks/project.hooks'
import { useMilestone, useSubmitMilestone } from '../../../../../hooks/milestone.hooks'

export const Route = createFileRoute('/freelancer/projects/$projectId/milestones/$milestoneId')({
  component: MilestoneDetail,
})

function MilestoneDetail() {
  const { projectId, milestoneId } = Route.useParams()
  const { data: projectAddress, isLoading: addressLoading } = useProjectEscrow(projectId)
  const { data: milestone, isLoading: milestoneLoading } = useMilestone(projectAddress, BigInt(milestoneId))
  const { mutateAsync: submitMilestone, isPending: isSubmitting } = useSubmitMilestone()

  const [cid, setCid] = useState('')

  if (addressLoading || milestoneLoading) {
    return <div className="p-4">Loading milestone...</div>
  }

  const handleSubmit = async () => {
    if (!cid) return alert('Please provide a CID')
    try {
      await submitMilestone({
        projectAddress: projectAddress!,
        index: BigInt(milestoneId),
        cid,
      })
      alert('Milestone submitted successfully!')
    } catch (e) {
      alert('Submission failed: ' + (e as Error).message)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Milestone #{milestoneId}</h1>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">Status:</span>
          <span className="font-medium">{milestone?.[2] || 'Unknown'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount:</span>
          <span className="font-medium">{milestone?.[1]?.toString() || '0'} wei</span>
        </div>
      </div>

      {milestone?.[2] === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Submit Deliverable</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IPFS CID</label>
            <input
              type="text"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              placeholder="Qm..."
              className="w-full p-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Work'}
          </button>
        </div>
      )}

      {milestone?.[2] === 3 && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          This milestone was rejected. Please review the feedback and resubmit.
        </div>
      )}
    </div>
  )
}
