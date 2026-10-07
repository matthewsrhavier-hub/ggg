/**
 * CineStore — Servidor backend & proxy
 * Integração Oficial Mercado Pago PIX
 */

const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
const PORT = 3000;

// Token de Acesso Mercado Pago
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'APP_USR-5559492872354691-031314-ead3dcc4182371789f734778c6854e0f-428533934';
const MP_BASE_URL     = 'https://api.mercadopago.com/v1';

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

// ─── MERCADO PAGO: CRIAR PIX ─────────────────────────────────────────────────
app.post(['/api/mercadopago/create-pix', '/api/pix/create', '/mercadopago/create-pix'], async (req, res) => {
    try {
        const { amount, description, payer_email } = req.body;
        const transactionAmount = parseFloat(amount) || 1.00;
        const idempotencyKey = 'cine_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        const payload = {
            transaction_amount: transactionAmount,
            description: description || 'CineStore - Filmes 4K',
            payment_method_id: 'pix',
            payer: {
                email: payer_email || 'cliente@cinestore.com.br',
                first_name: 'Cliente',
                last_name: 'CineStore'
            }
        };

        const response = await fetch(`${MP_BASE_URL}/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('[MercadoPago Create Error]', data);
            return res.status(response.status).json({
                message: data.message || (data.cause && data.cause[0] ? data.cause[0].description : 'Erro ao gerar PIX no Mercado Pago'),
                data
            });
        }

        const txData = data.point_of_interaction?.transaction_data || {};
        res.json({
            id: data.id,
            status: data.status,
            qr_code: txData.qr_code,
            qr_code_base64: txData.qr_code_base64,
            ticket_url: txData.ticket_url
        });
    } catch (err) {
        console.error('[MercadoPago Create Exception]', err.message);
        res.status(502).json({ message: 'Erro ao conectar com Mercado Pago: ' + err.message });
    }
});

// ─── MERCADO PAGO: CONSULTAR STATUS DO PAGAMENTO ─────────────────────────────
app.get(['/api/mercadopago/payment/:id', '/api/pix/status/:id', '/mercadopago/payment/:id'], async (req, res) => {
    try {
        const paymentId = req.params.id;
        const response = await fetch(`${MP_BASE_URL}/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('[MercadoPago Status Error]', data);
            return res.status(response.status).json({
                message: data.message || 'Erro ao consultar pagamento no Mercado Pago',
                data
            });
        }

        res.json({
            id: data.id,
            status: data.status, // "approved", "pending", "rejected", "cancelled"
            status_detail: data.status_detail
        });
    } catch (err) {
        console.error('[MercadoPago Status Exception]', err.message);
        res.status(502).json({ message: 'Erro ao conectar com Mercado Pago: ' + err.message });
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
        console.log(`  🎬  CineStore rodando em       → http://localhost:${PORT}`);
        console.log(`  💳  Mercado Pago PIX integrado → /api/mercadopago/*`);
        console.log('');
        console.log('  Abra o navegador em: http://localhost:3000');
        console.log('  Pressione Ctrl+C para parar o servidor.');
        console.log('');
    });
}

module.exports = app;
