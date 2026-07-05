import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			devOptions: {
				enabled: false
			},
			registerType: 'autoUpdate',
			manifest: {
				name: 'Gajian Aman',
				short_name: 'Gajian',
				description: 'Personal finance tracker for Indonesian users',
				theme_color: '#10b981',
				background_color: '#ffffff',
				display: 'fullscreen',
				start_url: '/',
				scope: '/',
				orientation: 'portrait',
				icons: [
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
			}
		})
	],
	server: {
		allowedHosts: [
			"thousand-sunny.bobtail-banfish.ts.net",
			"gajianaman.lazu.dev"
		],
	}
});
