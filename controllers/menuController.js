// controllers/menuController.js
import { MenuItem } from '/models/Menu.js';
import { StatusCodes } from 'http-status-codes';

export const getAllMenuItems = async (req, res) => {
    const { category, available } = req.query;
    const query = {};

    if (category) query.category = category;
    if (available) query.isAvailable = available === 'true';

    const menuItems = await MenuItem.find(query);
    res.status(StatusCodes.OK).json({
        status: 'success',
        results: menuItems.length,
        data: { menuItems }
    });
};

// Add other CRUD operations (getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem)