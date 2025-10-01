import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest, RegisterRequest } from '../types/auth';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { 
        email, 
        password, 
        displayName, 
        bio, 
        hobbies, 
        useLocation, 
        country, 
        city,
        // Optional profile fields
        age,
        job,
        company,
        education,
        university,
        relationshipStatus,
        lookingFor,
        interests,
        languages,
        height,
        lifestyle
      }: RegisterRequest = req.body;

      // Validate required fields
      if (!email || !password || !displayName) {
        res.status(400).json({
          success: false,
          error: 'Email, password, and display name are required'
        });
        return;
      }

      const result = await this.authService.register({
        email,
        password,
        displayName,
        bio,
        hobbies,
        useLocation,
        country,
        city,
        // Optional profile fields
        age,
        job,
        company,
        education,
        university,
        relationshipStatus,
        lookingFor,
        interests,
        languages,
        height,
        lifestyle
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      const result = await this.authService.login(email, password);

      if (result.success) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.authService.getUserById(req.user!.id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const authUser = this.authService.formatAuthUser(user);
      
      res.json({
        success: true,
        user: authUser
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user'
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // For JWT tokens, logout is handled client-side by removing the token
    // In a more advanced setup, you might maintain a blacklist of tokens
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}
