import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createOrUpdateUser, deleteUser } from '@/lib/actions/user';
import { connect } from '@/lib/mongodb/mongoose';

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('WEBHOOK_SECRET is missing');
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Await the headers() function
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing Svix headers:', { svix_id, svix_timestamp, svix_signature });
    return new Response('Error occurred -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', { status: 400 });
  }

  const { id } = evt?.data;
  const eventType = evt?.type;
  console.log(`Webhook with ID ${id} and type ${eventType}`);
  console.log('Webhook body:', body);

  try {
    await connect(); // Ensure MongoDB connection is established

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, first_name, last_name, image_url, email_addresses, username } = evt?.data;
      await createOrUpdateUser(id, first_name, last_name, image_url, email_addresses, username);
      return new Response('User is created or updated', { status: 200 });
    }

    if (eventType === 'user.deleted') {
      await deleteUser(id);
      return new Response('User is deleted', { status: 200 });
    }

    return new Response('Event type not handled', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(`Error occurred: ${error.message}`, { status: 400 });
  }
}