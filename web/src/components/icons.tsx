import type { SVGProps } from 'react';
import type { Segment } from '@/lib/types';

/** Ícones de traço simples, na cor do texto em volta (currentColor). */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const BagIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 7h12l1 13H5L6 7z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </Icon>
);

export const BackIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4 4" />
  </Icon>
);

export const TruckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 6h11v10H3z" />
    <path d="M14 9h4l3 3v4h-7" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </Icon>
);

export const ChatIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 5h16v11H9l-5 4z" />
  </Icon>
);

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 7h14" />
    <path d="M9 7V5h6v2" />
    <path d="M7 7l1 13h8l1-13" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

const HangerIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 6a2 2 0 1 1 2 2c-.6 0-1 .5-1 1v1" />
    <path d="M11 10 3.6 15.6c-.8.6-.4 1.4.6 1.4h15.6c1 0 1.4-.8.6-1.4L11 10" />
  </Icon>
);

const BurgerIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 11c0-3.3 3.6-6 8-6s8 2.7 8 6H4z" />
    <path d="M3 14h18" />
    <path d="M5 17h14v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1z" />
  </Icon>
);

const PawIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="6.5" cy="10.5" r="1.8" />
    <circle cx="9.5" cy="6.5" r="1.8" />
    <circle cx="14.5" cy="6.5" r="1.8" />
    <circle cx="17.5" cy="10.5" r="1.8" />
    <path d="M12 12c-2.8 0-5 2.6-5 5 0 1.7 1.3 2.5 2.7 2.5 1 0 1.5-.5 2.3-.5s1.3.5 2.3.5c1.4 0 2.7-.8 2.7-2.5 0-2.4-2.2-5-5-5z" />
  </Icon>
);

/** Desenho que fica no lugar da foto, de acordo com o tipo de loja. */
export function SegmentIcon({
  segment,
  ...props
}: IconProps & { segment: Segment }) {
  if (segment === 'CLOTHING') return <HangerIcon {...props} />;
  if (segment === 'SNACK_BAR') return <BurgerIcon {...props} />;
  if (segment === 'PET_SHOP') return <PawIcon {...props} />;
  return <BagIcon {...props} />;
}
