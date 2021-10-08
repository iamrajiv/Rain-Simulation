var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (d, b) {
          d.__proto__ = b;
        }) ||
      function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
      };
    return function (d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
function assert(condition) {
  if (!condition) throw new Error("Unexpected error.");
}
var DefaultAllocator = (function () {
  function DefaultAllocator(ctor) {
    this.ctor = ctor;
  }
  DefaultAllocator.prototype.allocate = function () {
    return new this.ctor();
  };
  DefaultAllocator.prototype.release = function (t) {};
  return DefaultAllocator;
})();
var PoolAllocator = (function () {
  function PoolAllocator(ctor) {
    this.ctor = ctor;
    this.freeList = [];
  }
  PoolAllocator.prototype.allocate = function () {
    return this.freeList.pop() || new this.ctor();
  };
  PoolAllocator.prototype.release = function (t) {
    this.freeList.push(t);
  };
  return PoolAllocator;
})();
var ComponentType = (function () {
  function ComponentType(componentName, allocator) {
    var _this = this;
    this.componentName = componentName;
    this.allocator = allocator;
    ComponentType.nameToReleaseFn[componentName] = function (t) {
      _this.release(t);
    };
  }
  ComponentType.prototype.allocate = function () {
    return this.allocator.allocate();
  };
  ComponentType.prototype.release = function (t) {
    this.allocator.release(t);
  };
  ComponentType.release = function (componentName, t) {
    ComponentType.nameToReleaseFn[componentName](t);
  };
  return ComponentType;
})();
ComponentType.nameToReleaseFn = Object.create(null);
var Entity = (function () {
  function Entity() {
    this.id = -1;
    this.components = Object.create(null);
  }
  Entity.prototype.add = function (componentType) {
    var component = componentType.allocate();
    this.components[componentType.componentName] = component;
    this.context.handleComponentAdded(this, component);
    return component;
  };
  Entity.prototype.get = function (componentType) {
    var componentName = componentType.componentName;
    var component = this.components[componentName];
    assert(component != null);
    return component;
  };
  Entity.prototype.remove = function (componentType) {
    var componentName = componentType.componentName;
    var component = this.components[componentName];
    assert(component != null);
    delete this.components[componentName];
    componentType.release(component);
    this.context.handleComponentRemoved(this, component);
  };
  Entity.prototype.removeAll = function () {
    for (var componentName in this.components) {
      var component = this.components[componentName];
      delete this.components[componentName];
      this.context.handleComponentRemoved(this, component);
      ComponentType.release(componentName, component);
    }
  };
  return Entity;
})();
var EntityList = (function () {
  function EntityList() {
    this.entities = [];
    this.entityIDToIndex = Object.create(null);
    this.nEntities = 0;
  }
  EntityList.prototype.addEntity = function (entity) {
    assert(typeof this.entityIDToIndex[entity.id] === "undefined");
    this.entityIDToIndex[entity.id] = this.entities.length;
    this.entities.push(entity);
    this.nEntities++;
  };
  EntityList.prototype.containsEntity = function (entity) {
    return typeof this.entityIDToIndex[entity.id] !== "undefined";
  };
  EntityList.prototype.removeEntity = function (entity) {
    var entities = this.entities;
    var entityIDToIndex = this.entityIDToIndex;
    var index = entityIDToIndex[entity.id];
    delete entityIDToIndex[entity.id];
    this.nEntities--;
    if (index !== this.nEntities) {
      var lastEntity = entities[this.nEntities];
      // Move the last element into the position of the released element
      entityIDToIndex[lastEntity.id] = index;
      entities[index] = lastEntity;
    }
    entities.pop();
  };
  return EntityList;
})();
var Group = (function (_super) {
  __extends(Group, _super);
  function Group(context, matcher) {
    var _this = _super.call(this) || this;
    _this.context = context;
    _this.matcher = matcher;
    _this.context.addObserver(_this);
    for (var _i = 0, _a = _this.context.entities; _i < _a.length; _i++) {
      var entity = _a[_i];
      if (matcher(entity)) {
        _this.addEntity(entity);
      }
    }
    return _this;
  }
  Group.prototype.handleComponentAdded = function (entity, component) {
    if (!this.containsEntity(entity) && this.matcher(entity)) {
      this.addEntity(entity);
    }
  };
  Group.prototype.handleComponentRemoved = function (entity, component) {
    if (this.containsEntity(entity) && !this.matcher(entity)) {
      this.removeEntity(entity);
    }
  };
  return Group;
})(EntityList);
var Group1 = (function (_super) {
  __extends(Group1, _super);
  function Group1(context, t) {
    var _this =
      _super.call(this, context, function (entity) {
        return typeof entity.components[t.componentName] !== "undefined";
      }) || this;
    _this.tName = t.componentName;
    return _this;
  }
  Group1.prototype.each = function (cb) {
    for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
      var entity = _a[_i];
      cb(entity.components[this.tName], entity);
    }
  };
  return Group1;
})(Group);
var Group2 = (function (_super) {
  __extends(Group2, _super);
  function Group2(context, t, u) {
    var _this =
      _super.call(this, context, function (entity) {
        return (
          typeof entity.components[t.componentName] !== "undefined" &&
          typeof entity.components[u.componentName] !== "undefined"
        );
      }) || this;
    _this.tName = t.componentName;
    _this.uName = u.componentName;
    return _this;
  }
  Group2.prototype.each = function (cb) {
    for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
      var entity = _a[_i];
      cb(entity.components[this.tName], entity.components[this.uName], entity);
    }
  };
  return Group2;
})(Group);
var Group3 = (function (_super) {
  __extends(Group3, _super);
  function Group3(context, t, u, v) {
    var _this =
      _super.call(this, context, function (entity) {
        return (
          typeof entity.components[t.componentName] !== "undefined" &&
          typeof entity.components[u.componentName] !== "undefined" &&
          typeof entity.components[v.componentName] !== "undefined"
        );
      }) || this;
    _this.tName = t.componentName;
    _this.uName = u.componentName;
    _this.vName = v.componentName;
    return _this;
  }
  Group3.prototype.each = function (cb) {
    for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
      var entity = _a[_i];
      cb(
        entity.components[this.tName],
        entity.components[this.uName],
        entity.components[this.vName],
        entity
      );
    }
  };
  return Group3;
})(Group);
var Context = (function (_super) {
  __extends(Context, _super);
  function Context() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.maxID = 1;
    _this.entityAllocator = new PoolAllocator(Entity);
    _this.observers = [];
    return _this;
  }
  Context.prototype.createEntity = function () {
    var entity = this.entityAllocator.allocate();
    entity.context = this;
    entity.id = this.maxID++;
    this.addEntity(entity);
    return entity;
  };
  Context.prototype.destroyEntity = function (entity) {
    entity.removeAll();
    this.removeEntity(entity);
    entity.id = -1;
    this.entityAllocator.release(entity);
  };
  Context.prototype.handleComponentAdded = function (entity, component) {
    for (var _i = 0, _a = this.observers; _i < _a.length; _i++) {
      var observer = _a[_i];
      observer.handleComponentAdded(entity, component);
    }
  };
  Context.prototype.handleComponentRemoved = function (entity, component) {
    for (var _i = 0, _a = this.observers; _i < _a.length; _i++) {
      var observer = _a[_i];
      observer.handleComponentRemoved(entity, component);
    }
  };
  Context.prototype.createGroupWith = function (t, u, v) {
    if (u && v) {
      return new Group3(this, t, u, v);
    } else if (u) {
      return new Group2(this, t, u);
    } else {
      return new Group1(this, t);
    }
  };
  Context.prototype.addObserver = function (observer) {
    this.observers.push(observer);
  };
  Context.prototype.removeObserver = function (observer) {
    var index = this.observers.indexOf(observer);
    assert(index !== -1);
    this.observers.splice(index, 1);
  };
  return Context;
})(EntityList);
var Simulation;
(function (Simulation) {
  var vecAllocator = {
    allocate: function () {
      return Vec2.allocateFromPool();
    },
    release: function (v) {
      v.returnToPool();
    },
  };
  var Position = new ComponentType("Position", vecAllocator);
  var Velocity = new ComponentType("Velocity", vecAllocator);
  function moveSystem(context) {
    var group = context.createGroupWith(Position, Velocity);
    var dp = new Vec2();
    return function move(dt) {
      group.each(function (p, v) {
        // dp = v dt
        dp.copyFrom(v);
        dp.scale(dt);
        p.add(dp);
      });
    };
  }
  var RigidBodyInfo = (function () {
    function RigidBodyInfo() {
      this.force = new Vec2();
      this.mass = 1.0;
    }
    RigidBodyInfo.prototype.clear = function () {
      this.force.clear();
      this.mass = 1.0;
    };
    return RigidBodyInfo;
  })();
  var RigidBody = new ComponentType(
    "RigidBody",
    new PoolAllocator(RigidBodyInfo)
  );
  function accelerationSystem(context) {
    var group = context.createGroupWith(Velocity, RigidBody);
    var dv = new Vec2();
    return function accelerate(dt) {
      group.each(function (v, body) {
        // dv = a dt = F/m dt
        dv.copyFrom(body.force);
        dv.scale(dt / body.mass);
        v.add(dv);
        body.force.clear();
      });
    };
  }
  function gravitySystem(context) {
    var group = context.createGroupWith(RigidBody);
    var df = new Vec2();
    return function applyGravity() {
      group.each(function (body, entity) {
        df.set(0, -9.8);
        df.scale(body.mass);
        body.force.add(df);
        // df = -9.8 * m [down]
      });
    };
  }
  var RAINDROP_MASS = 0.004; // kg
  var GRAVITY = 9.8; // m/s^2
  var TERMINAL_VELOCITY = 10.0; // m/s
  var TERMINAL_VELOCITY2 = TERMINAL_VELOCITY * TERMINAL_VELOCITY;
  function dragSystem(context) {
    var group = context.createGroupWith(Velocity, RigidBody);
    var df = new Vec2();
    var vDiff = new Vec2();
    var dragFactor = (RAINDROP_MASS * GRAVITY) / TERMINAL_VELOCITY2;
    return function applyDrag(vWind) {
      group.each(function (v, body, entity) {
        vDiff.copyFrom(v);
        vDiff.subtract(vWind);
        df.copyFrom(vDiff);
        df.scale(-dragFactor * vDiff.length());
        body.force.add(df);
        // df = -dragFactor * v
      });
    };
  }
  function recycleParticlesSystem(context, width, height) {
    var toRecycle = [];
    var group = context.createGroupWith(Position, ParticleAppearance);
    return function recycleParticlesSystem(dt) {
      group.each(function (position, _, entity) {
        if (position.y < 0) {
          resetParticle(entity);
        }
      });
    };
  }
  /**
   * Render particles
   */
  var TRAIL_SIZE = 6;
  var ParticleAppearanceInfo = (function () {
    function ParticleAppearanceInfo() {
      this.trail = [];
      for (var i = 0; i < TRAIL_SIZE; i++) {
        this.trail.push(Vec2.allocateFromPool());
      }
    }
    ParticleAppearanceInfo.prototype.set = function (radius, color) {
      this.radius = radius;
      this.color = color;
    };
    ParticleAppearanceInfo.prototype.resetTrail = function (position) {
      this.trailIndex = 0;
      for (var i = 0; i < TRAIL_SIZE; i++) {
        this.trail[i].copyFrom(position);
      }
    };
    ParticleAppearanceInfo.prototype.addToTrail = function (position) {
      this.trail[this.trailIndex++].copyFrom(position);
      this.trailIndex %= TRAIL_SIZE;
    };
    return ParticleAppearanceInfo;
  })();
  var ParticleAppearance = new ComponentType(
    "ParticleAppearance",
    new PoolAllocator(ParticleAppearanceInfo)
  );
  function particleRenderSystem(context, ctx, width, height) {
    var PIXELS_PER_METER = 100;
    var group = context.createGroupWith(Position, ParticleAppearance);
    return function renderParticles() {
      ctx.lineWidth = 0.5;
      group.each(function (p, appearance) {
        appearance.addToTrail(p);
        ctx.strokeStyle = appearance.color;
        ctx.beginPath();
        ctx.moveTo(p.x * PIXELS_PER_METER, height - p.y * PIXELS_PER_METER);
        for (var i = 0; i < TRAIL_SIZE; i++) {
          var index = (i + appearance.trailIndex) % TRAIL_SIZE;
          var trailPos = appearance.trail[index];
          ctx.lineTo(
            trailPos.x * PIXELS_PER_METER,
            height - trailPos.y * PIXELS_PER_METER
          );
        }
        ctx.stroke();
        // ctx.fillRect(p.x * PIXELS_PER_METER, height - p.y * PIXELS_PER_METER, appearance.radius, appearance.radius)
      });
    };
  }
  function resetParticle(entity) {
    entity.get(Position).set(3 + 12 * (Math.random() * 2 - 1), 6);
    entity.get(Velocity).set(0, -5 - Math.random() * 5); // Random speed between 5m/s and 10m/s down
    var rigidBody = entity.get(RigidBody);
    rigidBody.clear();
    rigidBody.mass = 0.004; // kg
    var appearance = entity.get(ParticleAppearance);
    appearance.resetTrail(entity.get(Position));
    appearance.set(1, "rgba(255, 255, 255, 1.0)");
  }
  /**
   * Bounce particles off of umbrella
   */
  function particleBounceSystem(context) {
    var group = context.createGroupWith(Position, Velocity, ParticleAppearance);
    var umbrellaCenter = new Vec2(2.91, 2.56);
    var radius = 1.12;
    var r2 = radius * radius;
    var v1 = new Vec2();
    var n = new Vec2();
    var e = 0.2; // coefficient of restititution
    var e2 = e * e;
    return function bounceParticles(dt) {
      group.each(function (p, v, appearance) {
        // n = p - center
        n.copyFrom(p);
        n.subtract(umbrellaCenter);
        if (p.y > umbrellaCenter.y && n.length2() < r2 && n.dot(v) < 0) {
          var a = n.length2();
          var b = 2 * v.dot(n);
          var c = (1 - e2) * v.length2();
          // The coefficient of restitution is not always
          // satisfiable. In those cases, setting the determinant to
          // zero has the same effect as using the maximum possible
          // coefficient of restitution.
          var det = Math.max(0, b * b - 4 * a * c);
          var k = (-b + Math.sqrt(det)) / (2 * a);
          v1.copyFrom(n);
          v1.scale(k);
          v1.add(v);
          v.copyFrom(v1);
          p.copyFrom(n);
          p.scale(radius / n.length());
          p.add(umbrellaCenter);
        }
      });
    };
  }
  /**
   * Generate new particle
   */
  function createParticle(context, width, height) {
    var entity = context.createEntity();
    entity.add(Position);
    entity.add(Velocity);
    entity.add(RigidBody);
    entity.add(ParticleAppearance);
    resetParticle(entity);
  }
  function startTick(cb) {
    (function tick() {
      cb();
      requestAnimationFrame(tick);
    })();
  }
  function main(canvas) {
    if (!canvas) {
      canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
    }
    var ctx = canvas.getContext("2d");
    var width = 600;
    var height = 600;
    canvas.width = width;
    canvas.height = height;
    var simContext = new Context();
    var recycleParticles = recycleParticlesSystem(simContext, 6, 6);
    var applyGravity = gravitySystem(simContext);
    var applyDrag = dragSystem(simContext);
    var accelerate = accelerationSystem(simContext);
    var move = moveSystem(simContext);
    var bounceParticles = particleBounceSystem(simContext);
    var renderParticles = particleRenderSystem(simContext, ctx, width, height);
    var windSpeed = new Vec2(0, 0);
    var MAX_WIND_SPEED = 40.0; // m/s
    canvas.addEventListener("mousemove", function (ev) {
      var xDirection = ev.offsetX / width - 0.5;
      windSpeed.set(MAX_WIND_SPEED * xDirection, 0);
    });
    function tick() {
      if (simContext.entities.length < 2000) {
        for (var i = 0; i < 5; i++) {
          createParticle(simContext, width, height);
        }
      }
      var dt = 1 / 60.0;
      recycleParticles(dt);
      applyGravity();
      applyDrag(windSpeed);
      accelerate(dt);
      move(dt);
      bounceParticles(dt);
      ctx.clearRect(0, 0, width, height);
      renderParticles();
    }
    startTick(tick);
  }
  Simulation.main = main;
})(Simulation || (Simulation = {}));
var Vec2 = (function () {
  function Vec2(x, y) {
    if (x === void 0) {
      x = 0;
    }
    if (y === void 0) {
      y = 0;
    }
    this.x = x;
    this.y = y;
  }
  Vec2.prototype.clone = function () {
    return new Vec2(this.x, this.y);
  };
  // Non-mutating operations
  Vec2.prototype.plus = function (other) {
    return new Vec2(this.x + other.x, this.y + other.y);
  };
  Vec2.prototype.minus = function (other) {
    return new Vec2(this.x - other.x, this.y - other.y);
  };
  Vec2.prototype.dot = function (other) {
    return this.x * other.x + this.y * other.y;
  };
  Vec2.prototype.scaledBy = function (scalar) {
    return new Vec2(this.x * scalar, this.y * scalar);
  };
  Vec2.prototype.length2 = function () {
    return this.x * this.x + this.y * this.y;
  };
  Vec2.prototype.length = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };
  // Mutation operations
  Vec2.prototype.add = function (other) {
    this.x += other.x;
    this.y += other.y;
  };
  Vec2.prototype.subtract = function (other) {
    this.x -= other.x;
    this.y -= other.y;
  };
  Vec2.prototype.scale = function (scalar) {
    this.x *= scalar;
    this.y *= scalar;
  };
  Vec2.prototype.set = function (x, y) {
    this.x = x;
    this.y = y;
  };
  Vec2.prototype.copyFrom = function (other) {
    this.x = other.x;
    this.y = other.y;
  };
  Vec2.prototype.clear = function () {
    this.x = 0;
    this.y = 0;
  };
  Vec2.allocateFromPool = function () {
    return Vec2.freeList.pop() || new Vec2();
  };
  Vec2.prototype.returnToPool = function () {
    Vec2.freeList.push(this);
  };
  return Vec2;
})();
// Memory pooling
Vec2.freeList = [];
