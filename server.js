/**
 * CineStore — Servidor proxy local
 * Resolve o problema de CORS fazendo as chamadas à SyncPay
 * de servidor para servidor (sem restrições de CORS).
 *
 * Rotas proxy:
 *   POST /api/syncpay/auth-token  → SyncPay /api/partner/v1/auth-token
 *   POST /api/syncpay/cash-in     → SyncPay /api/partner/v1/cash-in
 */

const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
const PORT = 3000;

const SYNCPAY_BASE = 'https://api.syncpayments.com.br/api/partner/v1';

// Parse JSON bodies
app.use(express.json());

// Serve arquivos estáticos (index.html, etc.)
app.use(express.static(path.join(__dirname)));

// ─── ROTAS PRINCIPAIS ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/cineadm', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ─── PROXY: Auth Token ────────────────────────────────────────────────────────
app.post(['/api/syncpay/auth-token', '/syncpay/auth-token'], async (req, res) => {
    try {
        const response = await fetch(`${SYNCPAY_BASE}/auth-token`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body:    JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('[Proxy Auth]', err.message);
        res.status(502).json({ message: 'Erro ao conectar com a SyncPay: ' + err.message });
    }
});

// ─── PROXY: Cash-In (PIX) ────────────────────────────────────────────────────
app.post(['/api/syncpay/cash-in', '/syncpay/cash-in'], async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Token de autorização não fornecido.' });
    }

    try {
        const response = await fetch(`${SYNCPAY_BASE}/cash-in`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Accept':        'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('[Proxy CashIn]', err.message);
        res.status(502).json({ message: 'Erro ao conectar com a SyncPay: ' + err.message });
    }
});

// ─── PROXY: Consultar Transação ──────────────────────────────────────────────
app.get(['/api/syncpay/transaction/:identifier', '/syncpay/transaction/:identifier'], async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Token de autorização não fornecido.' });
    }

    try {
        const response = await fetch(`${SYNCPAY_BASE}/transaction/${req.params.identifier}`, {
            method:  'GET',
            headers: {
                'Accept':        'application/json',
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        console.error('[Proxy Transaction]', err.message);
        res.status(502).json({ message: 'Erro ao conectar com a SyncPay: ' + err.message });
    }
});

// ─── START ───────────────────────────────────────────────────────────────────
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('');
        console.log('  ██████╗██╗███╗   ██╗███████╗███████╗████████╗ ██████╗ ██████╗ ███████╗');
        console.log('  ██╔════╝██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝');
        console.log('  ██║     ██║██╔██╗ ██║█████╗  ███████╗   ██║   ██║   ██║██████╔╝█████╗  ');
        console.log('  ██║     ██║██║╚██╗██║██╔══╝  ╚════██║   ██║   ██║   ██║██╔══██╗██╔══╝  ');
        console.log('  ╚██████╗██║██║ ╚████║███████╗███████║   ██║   ╚██████╔╝██║  ██║███████╗');
        console.log('   ╚═════╝╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝');
        console.log('');
        console.log(`  🎬  CineStore rodando em → http://localhost:${PORT}`);
        console.log(`  💳  Proxy PIX ativo       → /api/syncpay/*`);
        console.log('');
        console.log('  Abra o navegador em: http://localhost:3000');
        console.log('  Pressione Ctrl+C para parar o servidor.');
        console.log('');
    });
}

module.exports = app;
