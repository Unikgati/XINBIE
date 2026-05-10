'use client';

import React from 'react';
import AsyncSelect from 'react-select/async';
import { components } from 'react-select';
import { apiGet } from '@/lib/api';

interface ProductOption {
  value: string;
  label: string;
  image: string | null;
}

interface AsyncProductSelectProps {
  value: string | string[];
  onChange: (value: any) => void;
  isMulti?: boolean;
  placeholder?: string;
}

const customStyles = {
  control: (base: any) => ({ 
    ...base, 
    background: 'var(--surface)', 
    borderColor: 'var(--divider)', 
    borderRadius: 'var(--radius-md)', 
    minHeight: 40, 
    fontSize: 14,
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'var(--primary-light)'
    }
  }),
  menu: (base: any) => ({ ...base, background: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)', zIndex: 9999 }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  option: (base: any, state: any) => ({ 
    ...base, 
    background: state.isFocused ? 'var(--primary-surface)' : 'transparent', 
    color: 'var(--text-primary)', 
    fontSize: 13,
    cursor: 'pointer'
  }),
  multiValue: (base: any) => ({ ...base, background: 'var(--primary-surface)', borderRadius: 12 }),
  multiValueLabel: (base: any) => ({ ...base, color: 'var(--primary-dark)', fontSize: 12, fontWeight: 500, padding: '2px 6px' }),
  multiValueRemove: (base: any) => ({ ...base, color: 'var(--primary)', borderRadius: '0 12px 12px 0', ':hover': { background: 'var(--primary-light)', color: '#fff' } }),
  input: (base: any) => ({ ...base, color: 'var(--text-primary)' }),
  placeholder: (base: any) => ({ ...base, color: 'var(--text-hint)', fontSize: 13 }),
};

const CustomOption = (props: any) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 4, overflow: 'hidden', 
          background: 'var(--divider)', flexShrink: 0 
        }}>
          {data.image ? (
            <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-hint)' }}>image</span>
            </div>
          )}
        </div>
        <span>{data.label}</span>
      </div>
    </components.Option>
  );
};

const CustomMultiValueLabel = (props: any) => {
  const { data } = props;
  return (
    <components.MultiValueLabel {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ 
          width: 20, height: 20, borderRadius: 3, overflow: 'hidden', 
          background: 'var(--divider)', flexShrink: 0 
        }}>
          {data.image ? (
            <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 10, color: 'var(--text-hint)' }}>image</span>
            </div>
          )}
        </div>
        <span>{props.children}</span>
      </div>
    </components.MultiValueLabel>
  );
};

export default function AsyncProductSelect({ value, onChange, isMulti, placeholder }: AsyncProductSelectProps) {
  const loadOptions = async (inputValue: string) => {
    try {
      const res = await apiGet<any>(`/products?search=${inputValue}&limit=20`);
      const products = res.data || (Array.isArray(res) ? res : []);
      return products.map((p: any) => ({
        value: p.id,
        label: p.name,
        image: p.images?.[0] || null
      }));
    } catch (err) {
      console.error('Failed to load products', err);
      return [];
    }
  };

  // To show current values, we need to handle the fact that we might only have IDs
  // but react-select needs full objects. For now, we'll assume the parent provides objects or we handle IDs.
  // A better way is to fetch the current values' details once.
  
  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      isMulti={isMulti}
      loadOptions={loadOptions}
      styles={customStyles}
      placeholder={placeholder || "Cari produk..."}
      noOptionsMessage={({ inputValue }) => !inputValue ? "Ketik untuk mencari..." : "Produk tidak ditemukan"}
      loadingMessage={() => "Mencari..."}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      components={{
        Option: CustomOption,
        MultiValueLabel: CustomMultiValueLabel,
      }}
      value={value} // This needs to be the full object(s) [{value, label, image}]
      onChange={onChange}
    />
  );
}
