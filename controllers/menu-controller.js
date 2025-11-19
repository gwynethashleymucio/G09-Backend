import { StatusCodes } from 'http-status-codes';
import { Menu } from '../models/Menu.js';
import { NotFoundError } from '../middleware/error-middleware.js';

export const getAllMenuItems = async (req, res) => {
    const menuItems = await Menu.find({});
    res.status(StatusCodes.OK).json({ success: true, data: menuItems });
};

export const createMenuItem = async (req, res) => {
    const menuItem = await Menu.create(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, data: menuItem });
};