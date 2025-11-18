"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfigurePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the FlexAGEComps management page
    router.replace('/configure/flexagecomps');
  }, [router]);

  return null;
}
