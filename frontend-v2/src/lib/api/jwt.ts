import { SignJWT } from 'jose';

export async function mintSupabaseJWT(userId: string, secret: string): Promise<string> {
	const jwt = await new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('1h')
		.sign(new TextEncoder().encode(secret));
	return jwt;
}
