import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, Download, MoreVertical, Share, SquarePlus, X } from 'lucide-react'
import { useState } from 'react'
import { useInstallApp } from '../lib/pwa'
import { useStore } from '../store'

/** Real "install as an app" (PWA) button with platform-specific fallbacks. */
export function InstallApp() {
  const { canPrompt, installed, ios, install } = useInstallApp()
  const { notify } = useStore()
  const [help, setHelp] = useState(false)

  if (installed)
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf">
        <CircleCheck className="size-5" /> You’re using the EMBER app — buon appetito!
      </p>
    )

  const onClick = async () => {
    if (canPrompt) {
      const res = await install()
      if (res === 'accepted') notify({ title: 'EMBER installed 🔥', text: 'Find it on your home screen' })
      return
    }
    setHelp((v) => !v)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onClick}
          className="btn-flame flex h-14 items-center gap-2.5 rounded-2xl px-6 font-bold transition hover:brightness-110"
        >
          <Download className="size-5" />
          {ios ? 'Add to Home Screen' : 'Install the app'}
        </motion.button>
        <span className="text-xs leading-snug text-ash">
          Free · no app store needed
          <br />
          iPhone, Android & desktop
        </span>
      </div>

      <AnimatePresence>
        {help && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass relative mt-4 rounded-3xl p-5 text-sm">
              <button
                type="button"
                onClick={() => setHelp(false)}
                aria-label="Close instructions"
                className="absolute top-3 right-3 grid size-8 place-items-center rounded-full hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
              <p className="font-display font-semibold">Install EMBER in 2 taps</p>
              <ol className="mt-3 space-y-2.5 text-smoke">
                {ios ? (
                  <>
                    <li className="flex items-center gap-2">
                      1. Tap <Share className="size-4 text-amber" /> <b className="text-cream">Share</b> in Safari
                    </li>
                    <li className="flex items-center gap-2">
                      2. Choose <SquarePlus className="size-4 text-amber" /> <b className="text-cream">Add to Home Screen</b>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <b className="text-cream">Android:</b> menu <MoreVertical className="size-4 text-amber" /> → Install app
                    </li>
                    <li>
                      <b className="text-cream">Chrome / Edge on desktop:</b> the install icon at the right of the address bar
                    </li>
                    <li>
                      <b className="text-cream">iPhone:</b> open in Safari → Share → Add to Home Screen
                    </li>
                  </>
                )}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
