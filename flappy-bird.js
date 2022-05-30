import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const MAX_ANGLE = Math.PI / 16;
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
        this.shapes = {
            cube: new Cube(),
            sun: new defs.Subdivision_Sphere(4),
            square: new defs.Square(),
        };

        this.textures = {
            background: new Texture("assets/background.jpg"),
            lose: new Texture("assets/lose.jpg"),
        }

        // *** Materials
        this.materials = {
            plastic: new Material(
                new defs.Phong_Shader(),
                {
                    ambient: .6,
                    diffusivity: .6,
                    specularity: 0,
                    color: hex_color("#ffffff"),
                }),
            pure_color: new Material(
                new defs.Phong_Shader(),
                {
                    ambient: 1,
                    diffusivity: 0,
                    specularity: 0,
                }),
            background: new Material(
                new defs.Fake_Bump_Map(1), {
                    color: hex_color("#000000"),
                    ambient: 1, 
                    texture: this.textures.background,
                }),
            game_end: new Material(
                new defs.Fake_Bump_Map(1), {
                    color: hex_color("#000000"),
                    ambient: 1, diffusivity: 0.1, specularity: 0.1,
                    texture: this.textures.lose
                })
        }

        this.click_time = 0;
        this.base_y = 0;
        this.y = 0;
        this.initial_v_y = 4;
        this.angle = 0;
        this.pipe_num = 5;

        this.pipe_lens = Array.from({length: this.pipe_num}, () => Math.floor(Math.random() * 6) + 2) //return a array of length pipe_num filled by random integer from 2 to 7);
        this.pipe_gap = 20; //gap between top and bottom pipe
        this.pipe_distance = 10; //distance between 2 pipe
        this.starting_distance = 10; //the distance between first pipe and the bird
        this.game_start = false;
        this.elapsed_time_before_game_start = 0;
        this.game_speed = 4;
        this.sideview = true;
        this.sideview_cam_pos = Mat4.translation(0, -14, -36).times(Mat4.rotation(Math.PI/2,0, 1, 0));
        this.back_cam_pos = Mat4.translation(0, -15, -26).times(Mat4.rotation(Math.PI,0, 1, 0));
        this.game_end = false;
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
        this.new_line();
        this.key_triggered_button("Restart game", ["n"], () => {
            this.game_start = false;
            this.game_end = false;
            this.click_time = 0;
            this.elapsed_time_before_game_start = 0;
            this.angle = 0;
            this.y = 12;
        });
    }

    draw_box(context, program_state, model_transform, color) {
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color: color}));
    }

    draw_wings(context, program_state, model_transform) {
        const left_wing = model_transform.times(Mat4.translation(-1.15, -0.4, -0.4))
                                         .times(Mat4.scale(0.2, 0.6, 0.8));
        const right_wing = model_transform.times(Mat4.translation(1.15, -0.4, -0.4))
                                          .times(Mat4.scale(0.2, 0.6, 0.8));
        this.shapes.cube.draw(context, program_state, left_wing, this.materials.plastic.override({color: color(1, 1, 1, 1)}));
        this.shapes.cube.draw(context, program_state, right_wing, this.materials.plastic.override({color: color(1, 1, 1, 1)}));
    }

    draw_mouth(context, program_state, model_transform) {
        const lip_color = hex_color("#FE9800");
        const upper_lip = model_transform.times(Mat4.translation(0, 0, 1))
                                         .times(Mat4.scale(1.1, 0.2, 1));
        const lower_lip = model_transform.times(Mat4.translation(0, -0.3, 0.7))
                                         .times(Mat4.scale(1.05, 0.2, 1));
        this.shapes.cube.draw(context, program_state, upper_lip, this.materials.plastic.override({color: lip_color}));
        this.shapes.cube.draw(context, program_state, lower_lip, this.materials.plastic.override({color: lip_color}));
    }

    draw_eye(context, program_state, model_transform) {
        const white = hex_color("#FFFFFF");
        const black = hex_color("#000000");
        // right eye
        const right_bg_transform = model_transform.times(Mat4.translation(-0.75, 0.55, 0.7))
                                                  .times(Mat4.scale(0.1, 0.5, 0.3));
        const right_pupil_transform = model_transform.times(Mat4.translation(-0.8, 0.6, 0.7))
                                                     .times(Mat4.scale(0.1, 0.3, 0.15));
        this.shapes.cube.draw(context, program_state, right_bg_transform, this.materials.plastic.override({color: white}));
        this.shapes.cube.draw(context, program_state, right_pupil_transform, this.materials.plastic.override({color: black}));
        // left eye
        const left_bg_transform = model_transform.times(Mat4.translation(0.75, 0.55, 0.7))
                                                 .times(Mat4.scale(0.1, 0.5, 0.3));
        const left_pupil_transform = model_transform.times(Mat4.translation(0.8, 0.6, 0.7))
                                                    .times(Mat4.scale(0.1, 0.3, 0.15));
        this.shapes.cube.draw(context, program_state, left_bg_transform, this.materials.plastic.override({color: white}));
        this.shapes.cube.draw(context, program_state, left_pupil_transform, this.materials.plastic.override({color: black}));
    }

    draw_bird(context, program_state, model_transform) {
        const body_transform = model_transform.times(Mat4.scale(0.8, 1, 1.2));
        const yellow = hex_color("#F9DC35");
        this.draw_box(context, program_state, body_transform, yellow);
        this.draw_wings(context, program_state, model_transform);
        this.draw_mouth(context, program_state, model_transform);
        this.draw_eye(context, program_state, model_transform);
    }

    draw_pipe(context, program_state, model_transform, pipe_len) {
        const pipe_body_transform = model_transform.times(Mat4.scale(1, pipe_len, 1));
        const green = hex_color("#528A2C");
        const dark_green = hex_color("#142409");
        const pipe_top_transform = model_transform.times(Mat4.translation(0, pipe_len, 0))
                                                  .times(Mat4.scale(1.2, 0.5, 1.2));
        const pipe_inner_top_transform = model_transform.times(Mat4.translation(0, pipe_len, 0))
                                                        .times(Mat4.scale(0.9, 0.501, 0.9));
        this.draw_box(context, program_state, pipe_top_transform, green);
        this.draw_box(context, program_state, pipe_body_transform, green);
        this.shapes.cube.draw(context, program_state, pipe_inner_top_transform, this.materials.plastic.override({color:dark_green}));
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
        this.y = time_after_click === 0 ? 12 : this.y;
    }

    /**
     * get the bird's rotation angle based on the time passed since the latest click of "up".
     * */
    update_angle(time_after_click) {
        const angle_rate = DELTA_ANGLE * (1 + time_after_click);
        const angle = this.angle + time_after_click * angle_rate;
        this.angle = angle > MAX_ANGLE ? MAX_ANGLE : angle;
    }

    draw_all_pipe(context, program_state, model_transform) {
        for (let i = 0; i < this.pipe_num; i++) {
            const pipe_len = this.pipe_lens[i];

            //draw the bottom pipes
            const bottom_pipe_model_transform = model_transform.times(Mat4.translation(0, pipe_len - 11, i * this.pipe_distance))
            this.draw_pipe(context, program_state, bottom_pipe_model_transform, pipe_len);

            //draw top pipe
            const top_pipe_model_transform = model_transform.times(Mat4.translation(0, this.pipe_gap - (9 - pipe_len), i * this.pipe_distance))
                                                            .times(Mat4.rotation(Math.PI, 1, 0, 0));
            this.draw_pipe(context, program_state, top_pipe_model_transform, 9 - pipe_len);

            //determine collision on top and bottom
            if (bottom_pipe_model_transform[2][3] < 3 && bottom_pipe_model_transform[2][3] > -2) {
                const bottom_pipe_position = {
                    rx: bottom_pipe_model_transform[2][3] - 0.5,
                    ry: 0,
                    rw: 1,
                    rh: pipe_len * 2
                }
                if (this.isCollision(bottom_pipe_position)) {
                    this.game_end = true;
                }
            }

            if (top_pipe_model_transform[2][3] < 3 && top_pipe_model_transform[2][3] > -2) {
                const top_pipe_position = {
                    rx: top_pipe_model_transform[2][3] - 0.5,
                    ry: (this.pipe_gap - 9) + pipe_len * 2,
                    rw: 1,
                    rh: (9 - pipe_len) * 2
                }
                if (this.isCollision(top_pipe_position)) {
                    this.game_end = true;
                }
            }
        }
    }

    draw_three_sets_of_pipe(context, program_state, model_transform, t) {
        // draw three sets of pipes alternatively to avoid gap at render position change

        const game_elapsed_time = t - this.elapsed_time_before_game_start
        const pipe_set_length = this.pipe_distance * this.pipe_num

        // if the game has started, pipe set 1 position is calculated, else, it will be the starting_distance
        const pipe_pos1 = this.game_start ?
            (this.starting_distance - game_elapsed_time * this.game_speed) % pipe_set_length
            : this.starting_distance;

        const pipe_pos2 = pipe_pos1 + this.pipe_distance * this.pipe_num;
        const pipe_pos3 = pipe_pos1 - this.pipe_distance * this.pipe_num;

        const starting_pipe_model_transform1 = model_transform.times(Mat4.translation(0, 10, pipe_pos1));
        this.draw_all_pipe(context, program_state, starting_pipe_model_transform1);

        const starting_pipe_model_transform2 = model_transform.times(Mat4.translation(0, 10, pipe_pos2));
        this.draw_all_pipe(context, program_state, starting_pipe_model_transform2);

        if (this.game_start && (t - this.elapsed_time_before_game_start) * this.game_speed / this.pipe_distance > 5) {
            const starting_pipe_model_transform3 = model_transform.times(Mat4.translation(0, 10, pipe_pos3));
            this.draw_all_pipe(context, program_state, starting_pipe_model_transform3);
        }
    }


    isCollision(pipe_position) {
        const rx = pipe_position.rx, ry = pipe_position.ry, rw = pipe_position.rw, rh = pipe_position.rh;

        //bird only changes its y location
        const cx = 1.25, cy = this.y, radius = 1;

        // temporary variables to set edges for testing
        let testX = cx;
        let testY = cy;

        // which edge is closest?
        if (cx < rx) {
            testX = rx;        // compare to left edge
        } else if (cx > rx + rw){
            testX = rx + rw;     // right edge
        }

        if (cy < ry) {
            testY = ry;        // bottom edge
        } else if (cy > ry + rh){
            testY = ry + rh;     // top edge
        }

        // get distance from the closest edges
        const distX = cx - testX;
        const distY = cy - testY;
        const distance = Math.sqrt( (distX * distX) + (distY * distY) );
        //const myObj = { pipey : testY,pipex : testX, birdy : cy };
        //console.log(myObj);

        // if the distance is less than the radius, collision!
        return distance <= radius;
    }

    draw_ground(context, program_state, model_transform) {
        const ground_model_transform = model_transform.times(Mat4.scale(40, 1, 60))
                                                      .times(Mat4.translation(0, -1, 0));
        const green = hex_color("#82C963");
        this.shapes.cube.draw(context, program_state, ground_model_transform, this.materials.pure_color.override({color: green}));
    }

    draw_background(context, program_state, model_transform, t, type) {
        // Setup constants according to whether the background is at the front, back, left, or right.
        const rotation_angle = (type === "f" || type === "b") ? Math.PI / 2 : Math.PI;
        const translation_x = (type === "f" || type === "r") ? 40 : -40;
        const translation_z = type === "r" ? 60: (type === "l" ? -60 : -5 * t % 50 + 25);

        const background_transform = model_transform.times(Mat4.translation(translation_x, 65 - 1 / 5 * this.y, translation_z))
                                                    .times(Mat4.rotation(rotation_angle, 0, 1, 0))
                                                    .times(Mat4.scale(85, 85, 1));
        this.shapes.square.draw(context, program_state, background_transform, this.materials.background);

    }

    draw_all_backgrounds(context, program_state, model_transform, t) {
        this.draw_background(context, program_state, model_transform, t, "f");
        this.draw_background(context, program_state, model_transform, t, "b");
        this.draw_background(context, program_state, model_transform, t, "l");
        this.draw_background(context, program_state, model_transform, t, "r");
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, -14, -36).times(Mat4.rotation(Math.PI / 2, 0, 1, 0)));
            program_state.set_camera(this.sideview_cam_pos);
        }
        const matrix_transform = Mat4.identity();
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 100);
        const t = this.t = program_state.animation_time / 1000;
        const t_after_click = this.click_time === 0 ? 0 : t - this.click_time;

        this.elapsed_time_before_game_start = this.game_start ? this.elapsed_time_before_game_start : t; //keep track of the time before user begin to play

        this.update_y(t_after_click);
        this.update_angle(t_after_click);
        const model_transform = matrix_transform.times(Mat4.translation(0, this.y, 0))
                                                .times(Mat4.rotation(this.angle, 1, 0, 0));

        if(!this.game_end) {
            this.draw_bird(context, program_state, model_transform);
            this.draw_ground(context, program_state, matrix_transform);
            this.draw_all_backgrounds(context, program_state, matrix_transform, t);

            // draw three sets of pipes, one before the bird, one after the bird, and one with the bird
            this.draw_three_sets_of_pipe(context, program_state, matrix_transform, t);
        }
        else {
            //draw game end scene
            program_state.set_camera(this.sideview_cam_pos);
            this.sideview = true;
            this.shapes.square.draw(context, program_state, Mat4.rotation(Math.PI / 2 * 3, 0, 1, 0).times(Mat4.scale(20, 20, 1)), this.materials.game_end);
        }


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
