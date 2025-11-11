import { StatusCodes } from 'http-status-codes';
import { MenuItem } from './models/Menu.js';
import { NotFoundError } from '../errors/index.js';

export const getAllMenuItems = async (req, res) => {
    const menuItems = await MenuItem.find({});
    res.status(StatusCodes.OK).json({ success: true, data: menuItems });
};

export const createMenuItem = async (req, res) => {
    const menuItem = await MenuItem.create(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, data: menuItem });
};