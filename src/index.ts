import crypto from 'node:crypto'

export type ConsensusAgent = 'ORACLE' | 'SENTINEL' | 'CIPHER' | 'AXIOM' | 'MNEMEX'
export type Vote = 'approve' | 'reject'

export interface BridgedProject {
  sacmId: string
  legacyId: string
  legacySource: string
  name: string
  payload: unknown
  importedAt: string
  status: 'imported' | 'rejected' | 'optimizing' | 'sovereign'
  integrityHmac?: string
}

export interface AgentVote {
  agent: ConsensusAgent
  vote: Vote
  rationale: string
  signature: string
  wormPosition: number
}

export interface AgentWorkSeal {
  agent: string
  timestamp: string
  signature: string
}

export interface ConsensusProof {
  sacmId: string
  consensusId: string
  votes: AgentVote[]
  quorum: boolean
  approvalCount: number
  requiredQuorum: number
  wormHash: string
  sealedAt: string
  architecture: 'WORM-Causal-Consensus-Mesh'
  masterSeal: AgentWorkSeal
}

const AGENTS: ConsensusAgent[] = ['ORACLE', 'SENTINEL', 'CIPHER', 'AXIOM', 'MNEMEX']
const QUORUM_THRESHOLD = 0.6
const SECRET_PATTERNS = [/password/i, /secret/i, /token/i, /api.?key/i, /private.?key/i, /bearer/i]
const VENDOR_LOCK_KEYS = ['salesforce_id', 'hubspot', 'segment_id', 'mixpanel', 'amplitude', 'intercom']

export class SACMOptimizer {
  constructor(private readonly secret = process.env.VAULT_MASTER_SECRET ?? 'dev-sacm-optimizer-key') {
    if (process.env.NODE_ENV === 'production' && !process.env.VAULT_MASTER_SECRET) {
      throw new Error('VAULT_MASTER_SECRET is required in production')
    }
  }

  runConsensus(project: BridgedProject): ConsensusProof {
    if (project.status === 'rejected') {
      throw new Error(`Project ${project.sacmId} was rejected at bridge`)
    }

    const sealedAt = new Date().toISOString()
    const consensusId = `cons_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`
    const votes = AGENTS.map((agent, index) => this.evaluateAgent(agent, index, project, sealedAt))
    const approvalCount = votes.filter(v => v.vote === 'approve').length
    const requiredQuorum = Math.ceil(AGENTS.length * QUORUM_THRESHOLD)
    const wormHash = this.hmac(`${project.sacmId}:${consensusId}:${sealedAt}:${votes.map(v => v.signature).join(':')}`)
    const proofBase = {
      sacmId: project.sacmId,
      consensusId,
      votes,
      quorum: approvalCount >= requiredQuorum,
      approvalCount,
      requiredQuorum,
      wormHash,
      sealedAt,
      architecture: 'WORM-Causal-Consensus-Mesh' as const,
    }
    return {
      ...proofBase,
      masterSeal: {
        agent: 'MNEMEX',
        timestamp: sealedAt,
        signature: this.hmac(`MNEMEX:${sealedAt}:${wormHash}`),
      },
    }
  }

  verifyProof(proof: ConsensusProof): boolean {
    const expectedWormHash = this.hmac(`${proof.sacmId}:${proof.consensusId}:${proof.sealedAt}:${proof.votes.map(v => v.signature).join(':')}`)
    const expectedMaster = this.hmac(`MNEMEX:${proof.sealedAt}:${expectedWormHash}`)
    return proof.wormHash === expectedWormHash && proof.masterSeal.signature === expectedMaster
  }

  private evaluateAgent(agent: ConsensusAgent, wormPosition: number, project: BridgedProject, ts: string): AgentVote {
    const result = validators[agent](project)
    return {
      agent,
      vote: result.approved ? 'approve' : 'reject',
      rationale: result.rationale,
      signature: this.hmac(`${agent}:${project.sacmId}:${result.approved ? 'approve' : 'reject'}:${ts}:${wormPosition}:${result.rationale}`),
      wormPosition,
    }
  }

  private hmac(message: string): string {
    return crypto.createHmac('sha256', this.secret).update(message).digest('hex')
  }
}

interface ValidatorResult {
  approved: boolean
  rationale: string
}

const validators: Record<ConsensusAgent, (project: BridgedProject) => ValidatorResult> = {
  ORACLE(project) {
    const hasIdentity = Boolean(project.sacmId && project.legacyId && project.name && project.importedAt)
    return {
      approved: hasIdentity && project.status === 'imported',
      rationale: hasIdentity ? 'Project identity and bridge status are present' : 'Project identity is incomplete',
    }
  },
  SENTINEL(project) {
    const paths = findMatchingPaths(project.payload, SECRET_PATTERNS)
    return {
      approved: paths.length === 0,
      rationale: paths.length === 0 ? 'No credential-like fields detected' : `Credential-like fields detected: ${paths.join(', ')}`,
    }
  },
  CIPHER(project) {
    const payloadHash = sha256(stableStringify(project.payload))
    return {
      approved: payloadHash.length === 64 && Boolean(project.integrityHmac || project.sacmId),
      rationale: `Payload SHA-256 computed: ${payloadHash.slice(0, 16)}`,
    }
  },
  AXIOM(project) {
    const lockKeys = findMatchingPaths(project.payload, VENDOR_LOCK_KEYS.map(k => new RegExp(k, 'i')))
    return {
      approved: lockKeys.length <= 5,
      rationale: lockKeys.length === 0 ? 'No vendor lock-in keys detected' : `Vendor lock keys queued for sovereign strip: ${lockKeys.join(', ')}`,
    }
  },
  MNEMEX(project) {
    const importedAt = Date.parse(project.importedAt)
    return {
      approved: Number.isFinite(importedAt) && project.sacmId.startsWith('sacm_'),
      rationale: 'Causal memory anchor is parseable and SACM ID is namespaced',
    }
  },
}

function findMatchingPaths(value: unknown, patterns: RegExp[], path = '$'): string[] {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return value.flatMap((item, index) => findMatchingPaths(item, patterns, `${path}[${index}]`))
  if (typeof value !== 'object') return []
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const nextPath = `${path}.${key}`
    const own = patterns.some(p => p.test(key)) ? [nextPath] : []
    return own.concat(findMatchingPaths(child, patterns, nextPath))
  })
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  return `{${Object.keys(obj).sort().map(key => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}
