import assert from 'node:assert/strict'
import test from 'node:test'
import { SACMOptimizer, type BridgedProject } from '../src/index.js'

const cleanProject: BridgedProject = {
  sacmId: 'sacm_123456',
  legacyId: 'legacy-1',
  legacySource: 'github',
  name: 'Clean Project',
  payload: { data: { build: 'pass', owner: 'team' } },
  importedAt: new Date().toISOString(),
  status: 'imported',
  integrityHmac: 'present',
}

test('produces quorum for clean bridged projects', () => {
  const optimizer = new SACMOptimizer('test-secret')
  const proof = optimizer.runConsensus(cleanProject)

  assert.equal(proof.quorum, true)
  assert.equal(proof.approvalCount, 5)
  assert.equal(proof.requiredQuorum, 3)
  assert.equal(optimizer.verifyProof(proof), true)
})

test('records rejecting votes for credential-bearing payloads', () => {
  const optimizer = new SACMOptimizer('test-secret')
  const proof = optimizer.runConsensus({
    ...cleanProject,
    payload: { data: { apiToken: 'blocked' } },
  })

  const sentinel = proof.votes.find(v => v.agent === 'SENTINEL')
  assert.equal(sentinel?.vote, 'reject')
  assert.match(sentinel?.rationale ?? '', /Credential-like/)
})

test('refuses projects rejected by bridge', () => {
  const optimizer = new SACMOptimizer('test-secret')
  assert.throws(() => optimizer.runConsensus({ ...cleanProject, status: 'rejected' }), /rejected at bridge/)
})
