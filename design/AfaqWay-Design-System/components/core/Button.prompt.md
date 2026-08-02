One-line: The platform's capsule button — primary/ghost/neutral/destructive, the only button besides the journey's JrButton.

```jsx
<Button variant="primary" onClick={go}>Start your roadmap</Button>
<Button variant="ghost" icon={<ArrowRight size={16} />}>Talk to us</Button>
<Button variant="neutral" size="lg">Back</Button>
<Button variant="destructive" loading>Deleting…</Button>
```

Variants: `primary` (indigo fill, white text), `ghost` (indigo outline + text, tint on hover), `neutral` (subtle fill), `destructive` (red fill). Sizes `md` (40px) / `lg` (44px). `loading` swaps children for the Loader; `icon` sits before the label; press scales to .97. Radius is always a full pill.
