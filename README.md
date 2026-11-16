# Grox Web Wallet

The official Grox web wallet: **https://wallet.groxcoin.com**

Create a wallet, restore one from its 25-word seed, receive, send and see your history, in English or Arabic, from any browser.

## Your keys stay in your browser

- The wallet is created in your browser. Your seed and keys are never sent to any server.
- The saved wallet is encrypted with your password and kept in your browser (IndexedDB) on this device only.
- The page talks only to a Grox node (default `https://node.groxcoin.com`), which serves public chain data and relays signed transactions. The node never sees your keys. You can point the wallet to your own node in Settings.
- The page loads nothing from other sites and refuses to run inside a frame.

**Write down your 25-word seed.** It is the only way to recover your coins. Nobody from Grox will ever ask for it.
The only official address is **wallet.groxcoin.com**. Downloads of the desktop wallet are only on [GitHub releases](https://github.com/ahafarag/grox-coin/releases).

## How it is built

- Wallet engine: [monero-ts](https://github.com/woodser/monero-ts) (`df96624`) compiled to WebAssembly with the Grox source in place of Monero's, so seeds and addresses are the same as in the Grox Wallet app and `grox-wallet-cli`.
- Page: `src/app.js` and `src/index.html`, bundled with webpack (`src/webpack.config.js`) into `app.js`.
- `SHA256SUMS` lists the hashes of the files served here.

## Licenses

Grox and Monero code: BSD-3-Clause. monero-ts: MIT. Third-party notices: `app.js.LICENSE.txt`.
