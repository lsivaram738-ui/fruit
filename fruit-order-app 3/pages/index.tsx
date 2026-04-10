import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

export default function Home() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx);
  if (!session) return { redirect: { destination: '/login', permanent: false } };
  const role = (session.user as any)?.role;
  return {
    redirect: {
      destination: role === 'admin' ? '/admin' : '/dashboard',
      permanent: false,
    },
  };
};
