import { describe, it, expect } from 'vitest'
import { getRoles, hasRole, hasAnyRole } from './auth-utils'

describe('getRoles', () => {
  it('returns empty array for null/undefined', () => {
    expect(getRoles(null)).toEqual([])
    expect(getRoles(undefined)).toEqual([])
  })

  it('returns roles array when present', () => {
    expect(getRoles({ roles: ['ADMIN', 'USER'] })).toEqual(['ADMIN', 'USER'])
  })

  it('returns [role] for legacy role string', () => {
    expect(getRoles({ role: 'SECTION_OFFICER' })).toEqual(['SECTION_OFFICER'])
  })

  it('prefers roles over role', () => {
    expect(getRoles({ roles: ['ADMIN'], role: 'USER' })).toEqual(['ADMIN'])
  })

  it('returns [] for empty roles and no role', () => {
    expect(getRoles({})).toEqual([])
    expect(getRoles({ roles: [] })).toEqual([])
  })
})

describe('hasRole', () => {
  it('returns false for null user', () => {
    expect(hasRole(null, 'ADMIN')).toBe(false)
  })

  it('returns true when user has role in roles', () => {
    expect(hasRole({ roles: ['ADMIN', 'USER'] }, 'ADMIN')).toBe(true)
  })

  it('returns true when user has legacy role', () => {
    expect(hasRole({ role: 'ADMIN' }, 'ADMIN')).toBe(true)
  })

  it('returns false when user does not have role', () => {
    expect(hasRole({ roles: ['USER'] }, 'ADMIN')).toBe(false)
  })
})

describe('hasAnyRole', () => {
  it('returns false for null user', () => {
    expect(hasAnyRole(null, ['ADMIN'])).toBe(false)
  })

  it('returns true when user has any of the roles', () => {
    expect(hasAnyRole({ roles: ['USER'] }, ['ADMIN', 'USER'])).toBe(true)
  })

  it('returns false when user has none of the roles', () => {
    expect(hasAnyRole({ roles: ['USER'] }, ['ADMIN', 'DIVISION_HEAD'])).toBe(false)
  })
})
