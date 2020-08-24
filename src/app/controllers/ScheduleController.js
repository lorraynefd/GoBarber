<<<<<<< HEAD
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import {Op} from 'sequelize';
import Appointment from '../models/Appointments';
import User from '../models/User';

class ScheduleController{
    async index(req, res){
        const  checkUserProvider = await User.findOne({
            where: { id: req.userId, provider: true},
        });

        if(!checkUserProvider){
            return res.status(401).json({error: 'Usuario nao é um provedor de serviço'})
        }
        const {date} = req.query;
        const parsedDate = parseISO(date);
        const appointments = await Appointment.findAll({
            where:{
                provider_id: req.userId,
                canceled_at: null,
                date:{
                    [Op.between]:[
                        startOfDay(parsedDate),
                        endOfDay(parsedDate)
                    ],
                },
            },
            order:['date'],
        });
        return res.json({ data});
=======
import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
    async index(req, res) {
            const checkUserProvider = await User.findOne
        return res.json();
>>>>>>> 57c768bba01ec7175c4e603a6dcbc89a1d060614
    }
}

export default new ScheduleController();