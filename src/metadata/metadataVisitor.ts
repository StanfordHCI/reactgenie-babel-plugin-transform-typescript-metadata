import { NodePath } from '@babel/traverse';
import { types as t } from '@babel/core';
import {
  serializeDestructuringDefaultValues,
  serializeDestructuringType,
  serializeReturnArrayElementType,
  serializeReturnType,
  serializeType
} from './serializeType';

function createMetadataDesignDecorator(
  design: 'design:type' | 'design:paramtypes' | 'design:returntype' | 'design:typeinfo' | 'design:is_static' | 'design:destructuringparamtypes' | 'design:returnarrayelementtype' | 'design:destructuringparamvalues',
  typeArg: t.Expression | t.SpreadElement | t.JSXNamespacedName | t.ArgumentPlaceholder
): t.Decorator {
  return t.decorator(
    t.callExpression(
      t.memberExpression(
        t.identifier('Reflect'),
        t.identifier('metadata')
      ),
      [
        t.stringLiteral(design),
        typeArg
      ]
    )
  )
}

export function metadataVisitor(
  classPath: NodePath<t.ClassDeclaration>,
  path: NodePath<t.ClassProperty | t.ClassMethod>
) {
  const field = path.node;
  const classNode = classPath.node;

  switch (field.type) {
    case 'ClassMethod':
      const decorators =
        field.kind === 'constructor' ? classNode.decorators : field.decorators;

      if (!decorators || decorators.length === 0) return;

      decorators!.push(
        createMetadataDesignDecorator(
          'design:type',
          t.identifier('Function')
        )
      );
      decorators!.push(
        createMetadataDesignDecorator(
          'design:paramtypes',
          t.arrayExpression(
            field.params.map(param => serializeType(classPath, param))
          )
        )
      );

      let returnArray = false;

      // for ReactGenie, only support explicit return type
      if (field.returnType) {
        const returnType = serializeReturnType(classPath, path as NodePath<t.ClassMethod>);
        if (returnType) {
          if (returnType.type === 'Identifier' && returnType.name === 'Array') {
            returnArray = true;
          }
          decorators!.push(
            createMetadataDesignDecorator(
              'design:returntype',
              returnType
            )
          );
        }
      }

      if (returnArray) {
        const returnArrayElementType = serializeReturnArrayElementType(classPath, path as NodePath<t.ClassMethod>);
        if (returnArrayElementType) {
          decorators!.push(
            createMetadataDesignDecorator(
              'design:returnarrayelementtype',
              returnArrayElementType
            )
          );
        }
      }

      // for ReactGenie, emit whether the method is static
      const staticFieldMethod = field.static;
      if (staticFieldMethod) {
        decorators!.push(
          createMetadataDesignDecorator(
            'design:is_static',
            t.booleanLiteral(staticFieldMethod)
          )
        );
      }

      // if the method is a destructuring parameter, emit the types of the destructured parameters
      if (field.params.some(param => param.type === 'ObjectPattern')) {
        const types = field.params.map(param => serializeDestructuringType(classPath, param))
        decorators!.push(
          createMetadataDesignDecorator(
            'design:destructuringparamtypes',
            t.arrayExpression(
              types
            )
          )
        );
        const values = field.params.map(param => serializeDestructuringDefaultValues(classPath, param))
        decorators!.push(
          createMetadataDesignDecorator(
            'design:destructuringparamvalues',
            t.arrayExpression(
              values
            )
          )
        );
      }

      break;

    case 'ClassProperty':
      if (!field.decorators || field.decorators.length === 0) return;

      if (
        !field.typeAnnotation ||
        field.typeAnnotation.type !== 'TSTypeAnnotation'
      )
        return;

      field.decorators!.push(
        createMetadataDesignDecorator(
          'design:type',
          serializeType(classPath, field)
        )
      );
      // for ReactGenie, emit whether the method is static
      const staticFieldProperty = field.static;
      if (staticFieldProperty) {
        field.decorators!.push(
          createMetadataDesignDecorator(
            'design:is_static',
            t.booleanLiteral(staticFieldProperty)
          )
        );
      }
      break;
  }
}
