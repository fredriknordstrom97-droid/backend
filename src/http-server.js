import { createApp } from './http-app.js'

const port = process.env.PORT ?? 3000

createApp().listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
