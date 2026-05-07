# ElectricityDemandForecasting
Repository created to forecast electricity demands, which serves as a submission for Group 04 in IF5251 (AI in Production)'s Major Task.


## How to start

### UV

We use [uv](https://docs.astral.sh/uv/guides/projects/) for our python project and dependency management. 

To add or remove dependecies run:
```bash
uv add <dependency-names>
uv remove <dependency-names>
```

To syncronize the project and create a venv or install missing dependencies run:
```bash
uv sync
```

### Frontend

Navigate to the Frontend directory and install dependencies:
```bash
cd src/FrontEnd
npm install --force
```
> **Note**: The `--force` flag is necessary to resolve version conflicts.

Start the development server:
```bash
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).
