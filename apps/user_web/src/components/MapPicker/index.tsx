import dynamic from 'next/dynamic';

const MapPickerContent = dynamic(() => import('./MapPickerContent'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '300px', width: '100%', background: 'var(--color-surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
      Memuat Peta...
    </div>
  )
});

export default MapPickerContent;
