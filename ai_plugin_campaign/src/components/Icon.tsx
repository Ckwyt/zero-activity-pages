import type { SVGProps } from 'react';

export type IconName =
  | 'arrow-right'
  | 'arrow-up-right'
  | 'brain'
  | 'check'
  | 'chevron-down'
  | 'compass'
  | 'layers'
  | 'menu'
  | 'orbit'
  | 'sparkles'
  | 'wand'
  | 'x';

const paths: Record<IconName, React.ReactNode> = {
  'arrow-right': <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  'arrow-up-right': <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
  brain: <><path d="M9.5 4.5A3 3 0 0 0 4 6v1a3 3 0 0 0-1 5.24V14a3 3 0 0 0 3 3h.5A3.5 3.5 0 0 0 10 20.5V4.7" /><path d="M14.5 4.5A3 3 0 0 1 20 6v1a3 3 0 0 1 1 5.24V14a3 3 0 0 1-3 3h-.5a3.5 3.5 0 0 1-3.5 3.5V4.7" /><path d="M6.5 10.5A3.5 3.5 0 0 0 10 14" /><path d="M17.5 10.5A3.5 3.5 0 0 1 14 14" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" /></>,
  layers: <><path d="m12 2 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  orbit: <><circle cx="12" cy="12" r="2.5" /><ellipse cx="12" cy="12" rx="9" ry="4" /><ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(45 12 12)" /></>,
  sparkles: <><path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2Z" /><path d="m6 14-.8 2.2L3 17l2.2.8L6 20l.8-2.2L9 17l-2.2-.8Z" /><path d="m18 14-.6 1.4L16 16l1.4.6L18 18l.6-1.4L20 16l-1.4-.6Z" /></>,
  wand: <><path d="m15 4 5 5L8 21H3v-5Z" /><path d="m13 6 5 5" /><path d="m6 3 .5 1.5L8 5l-1.5.5L6 7l-.5-1.5L4 5l1.5-.5Z" /></>,
  x: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
};

export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
