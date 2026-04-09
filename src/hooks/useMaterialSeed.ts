import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { seedMaterialLibrary } from '@/services/materialSeedService';

export const useMaterialSeed = () => {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    seedMaterialLibrary()
      .then((count) => {
        if (count > 0) {
          toast.success(`Material library loaded — ${count} items across 45 trades`);
        }
      })
      .catch((err) => {
        console.error('Material seed failed:', err);
      });
  }, []);
};
