import { Router } from 'express';
import { GithubRepoController } from '../controllers/githubRepo.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.post('/', GithubRepoController.setupRepo);
router.get('/', GithubRepoController.getRepos);

export default router;
