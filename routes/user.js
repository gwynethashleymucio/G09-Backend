import express from 'express'

import { register } from '../controllers/user.js'

const router = express.Router()

router.post('/register', async(req, res) => {
    const isAdded = await register(req.body)
    res.json({ isAdded })
})

router.get('/:id', (req, res) => {
    res.json({ message: 'Pending GET /user implementation.' })
})

router.put('/:id', (req, res) => {
    res.json({ message: 'Pending PUT /user implementation.' })
})

router.delete('/:id', (res, req) =>{
    res.json({ message: 'Pending DELETE /user implementation.' })
});

router.post('/login', async (req, res) => {
  try {
    const result = await login(req.body)
    res.status(200).json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
});

export { router as userRoutes };