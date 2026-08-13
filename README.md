# کانون ایران‌نوین

Corporate website for کانون ایران‌نوین — an integrated advertising and marketing
group. Built with Next.js 16, React 19, and Tailwind CSS v4, in Persian with
full RTL layout.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Structure

```
src/app/           Routes: home, about, services, work, industries,
                   insights, careers, contact
src/components/    Header, Footer, and the home-page sections
src/lib/           Shared utilities
```

---

## Note: the `garm/` directory does not belong to this project

`garm/` holds a separate business — a digital precious-metals trading platform —
that was developed here temporarily and is intended to move to its own
repository. It shares no code with this website.

Extraction instructions are in [`garm/README.md`](garm/README.md). Once it has
been moved out, delete the directory from this repository.
