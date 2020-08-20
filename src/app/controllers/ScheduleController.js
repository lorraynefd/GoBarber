import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
    async index(req, res) {
            const checkUserProvider = await User.findOne
        return res.json();
    }
}

export default new ScheduleController();