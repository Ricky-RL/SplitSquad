import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import groupsRouter from './routes/groups';
import membersRouter from './routes/members';
import expensesRouter from './routes/expenses';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/groups', groupsRouter);
app.use('/members', membersRouter);
app.use('/expenses', expensesRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 