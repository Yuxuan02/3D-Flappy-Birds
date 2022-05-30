import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const MAX_ANGLE = Math.PI / 8;
const DELTA_ANGLE = Math.PI / 64;
class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
    }
}

export class Bird extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            cube: new Cube(),
            sun: new defs.Subdivision_Sphere(4),
        };
        // *** Materials
        this.materials = {
            plastic: new Material(
                new defs.Phong_Shader(),
                {
                    ambient: .4,
                    diffusivity: .6,
                    color: hex_color("#ffffff")
                }),
            pure_color: new Material(
                new defs.Phong_Shader(),
                {
                    ambient: 1,
                    diffusivity: 0,
                }
            ),
        }

        this.click_time = 0;
        this.base_y = 0;
        this.y = 0;
        this.initial_v_y = 4;
        this.angle = 0;
        this.pipe_num = 100;
        this.pipe_lens = Array.from({length: this.pipe_num}, () => Math.floor(Math.random() * 6) + 2) //return a array of lenth 5 filled by random integer from 2 to 7);
        this.pipe_gap = 20; //gap between top and bottom pipe
        this.pipe_distance = 10; //distance between 2 pipe
        this.starting_distance = 10; //the distance between first pipe and the bird
        this.game_start = false;
        this.elapsed_time_before_game_start = 0;
        this.game_speed = 4;
        this.sideview = true;
        this.sideview_cam_pos = Mat4.translation(0, -12, -32).times(Mat4.rotation(Math.PI/2,0, 1, 0));
        this.back_cam_pos = Mat4.translation(0, -15, -26).times(Mat4.rotation(Math.PI,0, 1, 0));
                                
    }

    make_control_panel() {
        this.key_triggered_button("Up", ["u"], () => {
            this.click_time = this.t;
            this.base_y = this.y;
            this.game_start = true;
            while (this.angle > -MAX_ANGLE) {
                this.angle -= DELTA_ANGLE;
            }
        });
        this.new_line();
        this.key_triggered_button("Change camera", ["c"], ()=> {
            this.sideview = !this.sideview;
        });
    }

    draw_box(context, program_state, model_transform, color) {
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:color}));
    }

    draw_wings(context, program_state, model_transform) {
        const left_wing = model_transform.times(Mat4.translation(-1.15, -0.4, -0.4))
                                         .times(Mat4.scale(0.2, 0.6,0.8));
        const right_wing = model_transform.times(Mat4.translation(1.15, -0.4, -0.4))
                                          .times(Mat4.scale(0.2, 0.6,0.8));
        this.shapes.cube.draw(context, program_state, left_wing, this.materials.plastic.override({color:color(1,1,1,1)}));
        this.shapes.cube.draw(context, program_state, right_wing, this.materials.plastic.override({color:color(1,1,1,1)}));
    }

    draw_mouth(context, program_state, model_transform) {
        const lip_color = hex_color("#FE9800");
        const upper_lip = model_transform.times(Mat4.translation(0, 0, 1))
                                         .times(Mat4.scale(1.1, 0.2, 1)); 
        const lower_lip = model_transform.times(Mat4.translation(0, -0.3, 0.7))
                                         .times(Mat4.scale(1.05, 0.2, 1)); 
        this.shapes.cube.draw(context, program_state, upper_lip, this.materials.plastic.override({color:lip_color}));
        this.shapes.cube.draw(context, program_state, lower_lip, this.materials.plastic.override({color:lip_color}));
    }

    draw_eye(context, program_state, model_transform) {
        const white = hex_color("#FFFFFF");
        const black = hex_color("#000000");
        // right eye
        const right_bg_transform = model_transform.times(Mat4.translation(-0.75,0.55,0.7))
                                                  .times(Mat4.scale(0.1,0.5,0.3));
        const right_pupil_transform = model_transform.times(Mat4.translation(-0.8,0.6,0.7))
                                                     .times(Mat4.scale(0.1,0.3,0.15));
        this.shapes.cube.draw(context, program_state, right_bg_transform, this.materials.plastic.override({color:white}));
        this.shapes.cube.draw(context, program_state, right_pupil_transform, this.materials.plastic.override({color:black}));
        // left eye
        const left_bg_transform = model_transform.times(Mat4.translation(0.75,0.55,0.7))
                                                 .times(Mat4.scale(0.1,0.5,0.3));
        const left_pupil_transform = model_transform.times(Mat4.translation(0.8,0.6,0.7))
                                                 .times(Mat4.scale(0.1,0.3,0.15)); 
        this.shapes.cube.draw(context, program_state, left_bg_transform, this.materials.plastic.override({color:white}));
        this.shapes.cube.draw(context, program_state, left_pupil_transform, this.materials.plastic.override({color:black}));
    }

    draw_bird(context, program_state, model_transform) {
        const body_transform = model_transform.times(Mat4.scale(0.8,1,1.2));
        const yellow = hex_color("#F9DC35");
        this.draw_box(context, program_state, body_transform, yellow);
        this.draw_wings(context, program_state, model_transform);
        this.draw_mouth(context, program_state, model_transform);
        this.draw_eye(context, program_state, model_transform);
    }
  
    draw_pipe(context, program_state, model_transform, pipe_len) {
        const pipe_body_transform = model_transform.times(Mat4.scale(1,pipe_len,1));
        const green = hex_color("#528A2C");
        const dark_green = hex_color("#142409");
        const pipe_top_transform = model_transform.times(Mat4.translation(0,pipe_len,0))
                                                  .times(Mat4.scale(1.2,0.5,1.2));
        const pipe_inner_top_transform = model_transform.times(Mat4.translation(0,pipe_len,0))
                                                        .times(Mat4.scale(0.9,0.501,0.9));
        this.draw_box(context, program_state, pipe_top_transform, green);
        this.draw_box(context, program_state, pipe_body_transform, green);
        this.shapes.cube.draw(context, program_state, pipe_inner_top_transform, this.materials.pure_color.override({color:dark_green}));
    }

    /**
    * update the bird's y position
    **/
    update_y(time_after_click) {
        // If user has not clicked "up" for once, t_after_click is set to 0.
        const dist_from_base_y = this.initial_v_y * time_after_click - 0.5 * 9.8 * time_after_click * time_after_click;
        
        // This line sets a minimum y position of 0 to make development easier.
        // In the actual game, once the user clicked "up", there is no such minimum y value, and
        // this line should be removed later.
        // this.y = dist_from_base_y + this.base_y
        this.y = dist_from_base_y + this.base_y >= 0 ? dist_from_base_y + this.base_y : 0;
        this.y = time_after_click === 0? 10:this.y;
    }
    /**
     * get the bird's rotation angle based on the time passed since the latest click of "up".
     * */
    update_angle(time_after_click) {
        const angle_rate = DELTA_ANGLE * (1 + time_after_click );
        const angle = this.angle + time_after_click * angle_rate;
        this.angle = angle > MAX_ANGLE * 3.5 ? MAX_ANGLE * 3.5 : angle;
    }
    
    draw_all_pipe(context, program_state, model_transform) {
        for(let i=0;i<this.pipe_num;i++){
            const pipe_len = this.pipe_lens[i];

            //draw the top pipes
            const bottom_pipe_model_transform = model_transform.times(Mat4.translation(0, pipe_len-11, i*this.pipe_distance))
            this.draw_pipe(context,program_state, bottom_pipe_model_transform, pipe_len);

            //draw bottom pipe
            const top_pipe_model_transform = model_transform.times(Mat4.translation(0, this.pipe_gap - (9-pipe_len), i*this.pipe_distance))
                                                                        .times(Mat4.rotation(Math.PI, 1,0,0));
            this.draw_pipe(context,program_state, top_pipe_model_transform, 9 - pipe_len);
        }
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.sideview_cam_pos);
        }
        const matrix_transform = Mat4.identity();
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        const t = this.t = program_state.animation_time / 1000;
        const t_after_click = this.click_time === 0 ? 0 : t - this.click_time;

        this.elapsed_time_before_game_start = this.game_start? this.elapsed_time_before_game_start:t; //keep track of the time before user begin to play

        this.update_y(t_after_click);
        this.update_angle(t_after_click);
        const model_transform = matrix_transform.times(Mat4.translation(0, this.y, 0))
                                                .times(Mat4.rotation(this.angle,1,0,0));
        this.draw_bird(context, program_state, model_transform);
        
        this.starting_distance = 10; //the distance between first pipe and the bird
        const pipe_pos = this.game_start? this.starting_distance - (t-this.elapsed_time_before_game_start) * this.game_speed: this.starting_distance;
        const starting_pipe_model_transform = matrix_transform.times(Mat4.translation(0, 10, pipe_pos));
        this.draw_all_pipe(context,program_state, starting_pipe_model_transform);

        const blending_factor = 0.1;
        if (!this.sideview) {
            // change to back cam position
            const desired = this.back_cam_pos;
            const transition = desired.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, blending_factor));
            program_state.set_camera(transition);
        } else {
            // change to side view
            const desired = this.sideview_cam_pos;
            const transition = desired.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, blending_factor));
            program_state.set_camera(transition);
        }
    }
}
