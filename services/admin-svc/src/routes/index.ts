import { Router } from 'express'
import {
  listUsers, getUser, changeUserRole,
  setUserActive, assignToClient,
  listClients, createNewClient, updateClientHandler,
  listAuditLogs,
} from '../controllers/adminController.js'

const router = Router()

// user management
router.get('/users', listUsers)
router.get('/users/:id', getUser)
router.patch('/users/:id/role', changeUserRole)
router.patch('/users/:id/active', setUserActive)
router.patch('/users/:id/assign-client', assignToClient)

// client management
router.get('/clients', listClients)
router.post('/clients', createNewClient)
router.patch('/clients/:id', updateClientHandler)

// audit logs — read only
router.get('/audit-logs', listAuditLogs)

export { router as adminRoutes }
