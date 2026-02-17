import fs from 'fs'
import path from 'path'

const moves = [
    { from: 'lib', to: 'src/lib' },
    { from: 'src/app/(admin)', to: 'src/app/admin' },
    { from: 'src/app/(citizen)', to: 'src/app/citizen' },
    { from: 'src/app/(officer)', to: 'src/app/officer' },
]

moves.forEach(({ from, to }) => {
    const src = path.resolve(from)
    const dest = path.resolve(to)

    if (fs.existsSync(src)) {
        console.log(`Moving ${src} to ${dest}`)
        try {
            fs.renameSync(src, dest)
        } catch (e) {
            console.error(`Failed to move ${src}:`, e.message)
            // Fallback: Copy and Remove (if cross-device)
            try {
                fs.cpSync(src, dest, { recursive: true })
                fs.rmSync(src, { recursive: true, force: true })
                console.log(`Copied and removed ${src}`)
            } catch (e2) {
                console.error(`Fallback failed for ${src}:`, e2.message)
            }
        }
    } else {
        console.log(`Source ${src} does not exist. Skipping.`)
    }
})
